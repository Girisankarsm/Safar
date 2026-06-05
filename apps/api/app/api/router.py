from fastapi import APIRouter

from app.api import auth, cities, esg, leaderboard, routes_api, safety, sos, transit, trips, wallet

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(cities.router)
api_router.include_router(routes_api.router)
api_router.include_router(trips.router)
api_router.include_router(safety.router)
api_router.include_router(transit.router)
api_router.include_router(sos.router)
api_router.include_router(wallet.router)
api_router.include_router(leaderboard.router)
api_router.include_router(esg.router)
