import uuid
from fastapi import APIRouter, HTTPException
from app.schemas.schemas import SettingsUpdate, EmergencyContactCreate
from app.core.demo_store import store

router = APIRouter()
settings_router = APIRouter()
contacts_router = APIRouter()


@router.get("/me")
def get_me():
    return {**store.user, "wallet": store.wallet}


@settings_router.patch("/settings")
def update_settings(req: SettingsUpdate):
    if req.women_safety_mode is not None:
        store.user["women_safety_mode"] = req.women_safety_mode
    if req.night_safe_preference is not None:
        store.user["night_safe_preference"] = req.night_safe_preference
    return store.user


@contacts_router.get("")
def list_contacts():
    return {"contacts": store.contacts}


@contacts_router.post("")
def add_contact(req: EmergencyContactCreate):
    contact = {
        "id": str(uuid.uuid4()),
        "name": req.name,
        "phone": req.phone,
        "relationship": req.relationship,
    }
    store.contacts.append(contact)
    return contact


@contacts_router.delete("/{contact_id}")
def delete_contact(contact_id: str):
    store.contacts = [c for c in store.contacts if c["id"] != contact_id]
    return {"success": True}
