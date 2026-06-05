import uuid
from fastapi import APIRouter, HTTPException
from app.schemas.schemas import SettingsUpdate, EmergencyContactCreate
from app.services.data import repository as repo

router = APIRouter()
settings_router = APIRouter()
contacts_router = APIRouter()


@router.get("/me")
def get_me():
    return repo.get_current_user()


@settings_router.patch("/settings")
def update_settings(req: SettingsUpdate):
    return repo.update_user_settings(req.women_safety_mode, req.night_safe_preference)


@contacts_router.get("")
def list_contacts():
    return {"contacts": repo.get_emergency_contacts()}


@contacts_router.post("")
def add_contact(req: EmergencyContactCreate):
    return repo.add_emergency_contact(req.name, req.phone, req.relationship)


@contacts_router.delete("/{contact_id}")
def delete_contact(contact_id: str):
    repo.delete_emergency_contact(contact_id)
    return {"success": True}
