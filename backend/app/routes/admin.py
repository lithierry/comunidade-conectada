from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.core.config import get_settings
from app.core.security import check_login_rate_limit, clear_login_attempts, create_session, require_admin, verify_origin, verify_password
from app.schemas.announcement import LoginInput

router = APIRouter(prefix="/admin", tags=["admin-auth"])


@router.post("/login", status_code=status.HTTP_204_NO_CONTENT)
def login(payload: LoginInput, request: Request, response: Response):
    verify_origin(request)
    client_id = request.client.host if request.client else "unknown"
    check_login_rate_limit(client_id)
    if not verify_password(payload.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas.")
    clear_login_attempts(client_id)
    response.set_cookie(
        key="cc_admin", value=create_session(), httponly=True, secure=get_settings().cookie_secure,
        samesite="lax", max_age=8 * 60 * 60, path="/api",
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def logout(request: Request, response: Response):
    verify_origin(request)
    response.delete_cookie("cc_admin", path="/api")


@router.get("/session", dependencies=[Depends(require_admin)])
def session():
    return {"authenticated": True}
