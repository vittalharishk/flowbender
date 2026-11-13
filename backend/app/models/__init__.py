"""SQLAlchemy models for Flowbender."""

from .core import (
    AuditLog,
    Branch,
    Organization,
    User,
    UserSession,
)
from .projects import Project
from .cast import (
    ArtistAvailability,
    CastCandidate,
    CastContract,
    CastDecisionLogEntry,
    CastMember,
    CharacterProfile,
)
from .crew import (
    CrewAssignment,
    CrewMember,
    CrewPaymentRecord,
    RemunerationAgreement,
)
from .scripts import (
    Scene,
    Script,
    ScriptVersion,
)
from .schedule import (
    AttendanceRecord,
    CallSheet,
    CateringAdjustment,
    ScheduleEntry,
    ShootDay,
)
from .production import (
    CalendarEvent,
    DprReport,
    PreProdChecklistItem,
    ProductionTask,
)
from .post_production import (
    DeliverableItem,
    PostProductionItem,
    PostProdMilestone,
    SubtitleLanguage,
)
from .assets import (
    CameraCard,
    EquipmentAllocation,
    EquipmentItem,
    EquipmentMaintenance,
    FootageMetadata,
    MediaAsset,
    MediaVersion,
    StorageDevice,
    VfxReview,
    VfxShot,
    VfxVersion,
)
from .crew_departments import (
    Caravan,
    CaravanAllocation,
    DriverAssignment,
    DriverProfile,
    ExpensePayment,
    FilmLocation,
    Hotel,
    HotelBooking,
    HotelPayment,
    LocationAgreement,
    LocationPayment,
    LocationScouting,
    MaintenanceRecord,
    OfficeRental,
    OfficeRentPayment,
    ProductionExpense,
    ProductionSet,
    ProductionVehicle,
    PropItem,
    PropTransaction,
    RentalPayment,
    RentalRecord,
    RentalVendor,
    SetTask,
    StuntEquipment,
    StuntEquipmentTransaction,
    StuntPlan,
    StuntSafetyChecklist,
    TravelPayment,
    Trip,
    VehicleAllocation,
)
from .finance import (
    BudgetLineItem,
    BudgetRevision,
    DepartmentBudget,
    ExpenseItem,
    InsuranceClaim,
    InsurancePolicy,
    PayrollEntry,
    ProjectBudget,
    PurchaseOrder,
    Vendor,
)
from .distribution import (
    DistributionAgreement,
    DistributionRelease,
    DistributionRevenue,
    DistributionSettlement,
    RightsDeal,
)
from .settings import (
    Notification,
    UserPreference,
)

# F1-F7 New Models
from .business import (
    BrandingDeal,
    BrandingDeliverable,
    BrandingPayment,
    BurnRecord,
    FundingTranche,
    InvestmentTransaction,
    Investor,
    InvestorProject,
    Loan,
    LoanRepayment,
    OstPayment,
    OstReceivable,
)
from .post_production_ext import (
    BgmCue,
    DubbingSession,
    EditingTask,
    EditingVersion,
    MarketingCampaign,
    PublicityAsset,
    TrailerTeaser,
)
from .distribution_ext import (
    AudioDistribution,
    DigitalDistribution,
    DistributionTerritory,
    Receivable,
    ReceivablePayment,
    SatelliteDistribution,
)
from .teams import (
    Department,
    TeamMember,
    TeamProjectAssignment,
    UserDepartmentAccess,
    UserProjectAccess,
)
from .report_config import ReportConfig

__all__ = [
    # Core
    "Organization", "Branch", "User", "UserSession", "AuditLog",
    # Projects
    "Project",
    # Cast
    "CastMember", "CastContract", "CastCandidate", "CharacterProfile",
    "ArtistAvailability", "CastDecisionLogEntry",
    # Crew
    "CrewMember", "CrewAssignment", "RemunerationAgreement", "CrewPaymentRecord",
    # Scripts
    "Script", "ScriptVersion", "Scene",
    # Schedule
    "ScheduleEntry", "ShootDay", "CallSheet", "AttendanceRecord", "CateringAdjustment",
    # Production
    "ProductionTask", "PreProdChecklistItem", "DprReport", "CalendarEvent",
    # Post-Production
    "PostProductionItem", "PostProdMilestone", "DeliverableItem", "SubtitleLanguage",
    # Assets
    "EquipmentItem", "EquipmentAllocation", "EquipmentMaintenance",
    "CameraCard", "StorageDevice", "FootageMetadata",
    "MediaAsset", "MediaVersion", "VfxShot", "VfxVersion", "VfxReview",
    # Crew Departments
    "RentalVendor", "RentalRecord", "RentalPayment",
    "ProductionExpense", "ExpensePayment",
    "OfficeRental", "OfficeRentPayment", "MaintenanceRecord",
    "FilmLocation", "LocationScouting", "LocationAgreement", "LocationPayment",
    "Hotel", "HotelBooking", "HotelPayment", "Trip", "TravelPayment",
    "PropItem", "PropTransaction", "ProductionSet", "SetTask",
    "ProductionVehicle", "VehicleAllocation",
    "Caravan", "CaravanAllocation", "DriverProfile", "DriverAssignment",
    "StuntPlan", "StuntSafetyChecklist", "StuntEquipment", "StuntEquipmentTransaction",
    # Finance
    "ProjectBudget", "DepartmentBudget", "BudgetRevision", "BudgetLineItem",
    "PurchaseOrder", "Vendor", "InsurancePolicy", "InsuranceClaim",
    "ExpenseItem", "PayrollEntry",
    # Distribution
    "RightsDeal", "DistributionAgreement", "DistributionRelease",
    "DistributionRevenue", "DistributionSettlement",
    # Settings
    "Notification", "UserPreference",
    # Business (F2)
    "Investor", "InvestorProject", "InvestmentTransaction",
    "Loan", "LoanRepayment",
    "BrandingDeal", "BrandingDeliverable", "BrandingPayment",
    "FundingTranche", "OstReceivable", "OstPayment", "BurnRecord",
    # Post-Production Extension (F1)
    "EditingTask", "EditingVersion", "DubbingSession", "BgmCue",
    "TrailerTeaser", "PublicityAsset", "MarketingCampaign",
    # Distribution Extension (F3)
    "DistributionTerritory", "DigitalDistribution", "SatelliteDistribution",
    "AudioDistribution", "Receivable", "ReceivablePayment",
    # Teams (F4)
    "Department", "TeamMember", "TeamProjectAssignment",
    "UserProjectAccess", "UserDepartmentAccess",
    # Reports (F5)
    "ReportConfig",
]
