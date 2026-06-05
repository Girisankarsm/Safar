from fastapi import APIRouter
from app.api.v1 import routes, trips, safety, wallet, leaderboard, sos, users, cities

api_router = APIRouter()
api_router.include_router(cities.router, prefix="/cities", tags=["cities"])
api_router.include_router(users.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.settings_router, prefix="/users", tags=["users"])
api_router.include_router(routes.router, prefix="/routes", tags=["routes"])
api_router.include_router(trips.router, prefix="/trips", tags=["trips"])
api_router.include_router(safety.router, prefix="/safety", tags=["safety"])
api_router.include_router(safety.roads_router, prefix="/roads", tags=["roads"])
api_router.include_router(wallet.router, prefix="/wallet", tags=["wallet"])
api_router.include_router(leaderboard.router, prefix="/leaderboard", tags=["leaderboard"])
api_router.include_router(sos.router, prefix="/sos", tags=["sos"])
api_router.include_router(users.contacts_router, prefix="/emergency-contacts", tags=["emergency-contacts"])
