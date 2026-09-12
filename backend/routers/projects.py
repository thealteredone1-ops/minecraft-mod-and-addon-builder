from __future__ import annotations

import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from lib.ai import generate_mod_spec
from lib.auth import current_user
from lib.db import db
from lib.exporter import build_bedrock_pack, build_java_zip
from models.schemas import (
    GenerateRequest,
    MessageResponse,
    ModSpec,
    Project,
    ProjectSummary,
    UpdateSpecRequest,
    User,
)

router = APIRouter(prefix="/projects", tags=["projects"])


def _summary(doc: dict) -> ProjectSummary:
    spec = doc.get("spec", {}) or {}
    count = sum(len(spec.get(k, []) or []) for k in ("items", "blocks", "recipes", "mobs", "gear", "ores"))
    updated = doc.get("updated_at") or datetime.now(timezone.utc)
    if updated.tzinfo is None:
        updated = updated.replace(tzinfo=timezone.utc)
    return ProjectSummary(
        id=doc["id"],
        mod_name=spec.get("mod_name", "Untitled Mod"),
        mod_id=spec.get("mod_id", "untitled"),
        description=spec.get("description", ""),
        target=doc.get("target", "both"),
        loader=doc.get("loader", "forge"),
        mature=bool(doc.get("mature")),
        element_count=count,
        updated_at=updated,
    )


def _project(doc: dict) -> Project:
    doc = dict(doc)
    doc.pop("_id", None)
    for key in ("created_at", "updated_at"):
        val = doc.get(key)
        if isinstance(val, datetime) and val.tzinfo is None:
            doc[key] = val.replace(tzinfo=timezone.utc)
    return Project(**doc)


async def _load(project_id: str, user: User) -> dict:
    doc = await db.projects.find_one({"id": project_id, "owner_id": user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    return doc


@router.get("", response_model=list[ProjectSummary])
async def list_projects(user: User = Depends(current_user)) -> list[ProjectSummary]:
    docs = await db.projects.find({"owner_id": user.id}).sort("updated_at", -1).to_list(200)
    return [_summary(d) for d in docs]


@router.post("/generate", response_model=Project)
async def generate(payload: GenerateRequest, user: User = Depends(current_user)) -> Project:
    # Generations are unlimited on every plan; Pro only unlocks 18+ mature content.
    if payload.mature and user.plan != "pro":
        raise HTTPException(status_code=402, detail="Mature (18+) mod generation requires ModCraft Pro")
    try:
        spec: ModSpec = await generate_mod_spec(payload.prompt, payload.mature)
    except Exception as exc:  # surface a clean error instead of a bare 500
        raise HTTPException(status_code=502, detail=f"Mod generation failed: {exc}") from exc

    project = Project(
        owner_id=user.id,
        prompt=payload.prompt,
        target=payload.target,
        loader=payload.loader,
        mature=payload.mature,
        spec=spec,
    )
    await db.projects.insert_one(project.model_dump())
    await db.users.update_one({"id": user.id}, {"$inc": {"mods_generated": 1}})
    return project


@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: str, user: User = Depends(current_user)) -> Project:
    return _project(await _load(project_id, user))


@router.put("/{project_id}", response_model=Project)
async def update_project(
    project_id: str, payload: UpdateSpecRequest, user: User = Depends(current_user)
) -> Project:
    await _load(project_id, user)
    now = datetime.now(timezone.utc)
    await db.projects.update_one(
        {"id": project_id, "owner_id": user.id},
        {"$set": {"spec": payload.spec.model_dump(), "updated_at": now}},
    )
    return _project(await _load(project_id, user))


@router.delete("/{project_id}", response_model=MessageResponse)
async def delete_project(project_id: str, user: User = Depends(current_user)) -> MessageResponse:
    await _load(project_id, user)
    await db.projects.delete_one({"id": project_id, "owner_id": user.id})
    return MessageResponse(message="deleted")


@router.get("/{project_id}/export/{platform}")
async def export_project(project_id: str, platform: str, user: User = Depends(current_user)):
    doc = await _load(project_id, user)
    spec = ModSpec(**doc["spec"])
    if platform == "java":
        data = build_java_zip(spec, doc.get("loader", "forge"))
        filename = f"{spec.mod_id}-java-{doc.get('loader', 'forge')}.zip"
    elif platform == "bedrock":
        data = build_bedrock_pack(spec)
        filename = f"{spec.mod_id}.mcaddon"
    else:
        raise HTTPException(status_code=404, detail="Unknown export platform")
    return StreamingResponse(
        io.BytesIO(data),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
