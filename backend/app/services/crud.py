from typing import Any, Generic, Optional, Sequence, Type, TypeVar
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import func, select, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def _scope(self, stmt, organization_id: UUID):
        """Restrict a query to one organization.

        Not every table carries organization_id: link tables (investor-projects,
        team assignments, access grants) are scoped through their project or user,
        and the organizations table through its own id.
        """
        from ..models import Organization, Project, User

        model = self.model
        if hasattr(model, "organization_id"):
            return stmt.where(model.organization_id == organization_id)
        if model is Organization:
            return stmt.where(model.id == organization_id)
        if hasattr(model, "project_id"):
            return stmt.where(
                model.project_id.in_(
                    select(Project.id).where(Project.organization_id == organization_id)
                )
            )
        if hasattr(model, "user_id"):
            return stmt.where(
                model.user_id.in_(
                    select(User.id).where(User.organization_id == organization_id)
                )
            )
        raise ValueError(f"{model.__name__} has no organization scope")

    async def get(
        self, db: AsyncSession, id: UUID, organization_id: UUID
    ) -> Optional[ModelType]:
        stmt = self._scope(select(self.model).where(self.model.id == id), organization_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_multi(
        self,
        db: AsyncSession,
        organization_id: UUID,
        *,
        skip: int = 0,
        limit: int = 50,
        project_id: Optional[UUID] = None,
        filters: Optional[dict[str, Any]] = None,
    ) -> tuple[Sequence[ModelType], int]:
        stmt = self._scope(select(self.model), organization_id)

        if project_id and hasattr(self.model, "project_id"):
            stmt = stmt.where(self.model.project_id == project_id)

        if filters:
            for key, value in filters.items():
                if value is not None and hasattr(self.model, key):
                    stmt = stmt.where(getattr(self.model, key) == value)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        count_result = await db.execute(count_stmt)
        total = count_result.scalar_one()

        stmt = stmt.offset(skip).limit(limit)
        if hasattr(self.model, "created_at"):
            stmt = stmt.order_by(self.model.created_at.desc())

        result = await db.execute(stmt)
        items = result.scalars().all()

        return items, total

    async def create(
        self,
        db: AsyncSession,
        obj_in: CreateSchemaType,
        organization_id: UUID,
        **extra_fields,
    ) -> ModelType:
        data = obj_in.model_dump(exclude_unset=True)
        if hasattr(self.model, "organization_id"):
            data["organization_id"] = organization_id
        data.update(extra_fields)

        db_obj = self.model(**data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        db_obj: ModelType,
        obj_in: UpdateSchemaType,
    ) -> ModelType:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def delete(
        self, db: AsyncSession, id: UUID, organization_id: UUID
    ) -> bool:
        obj = await self.get(db, id, organization_id)
        if obj is None:
            return False
        await db.delete(obj)
        await db.commit()
        return True
