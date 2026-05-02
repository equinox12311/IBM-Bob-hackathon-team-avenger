"""
Code Modernization Agent Module
Uses Bob to auto-upgrade codebases (Java 8→21, Python 2→3, etc.)
"""
from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel
from enum import Enum


class ModernizationType(str, Enum):
    """Types of modernization"""
    JAVA_8_TO_21 = "java_8_to_21"
    PYTHON_2_TO_3 = "python_2_to_3"
    SPRING_TO_BOOT_3 = "spring_to_boot_3"
    REACT_CLASS_TO_HOOKS = "react_class_to_hooks"
    NODEJS_14_TO_20 = "nodejs_14_to_20"


class ModernizationStatus(str, Enum):
    """Modernization status"""
    ANALYZING = "analyzing"
    READY = "ready"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class BreakingChange(BaseModel):
    """A breaking change that needs attention"""
    file: str
    line: int
    description: str
    severity: str  # "high", "medium", "low"
    auto_fixable: bool
    suggested_fix: Optional[str] = None


class ModernizationPlan(BaseModel):
    """Plan for modernizing a codebase"""
    id: str
    type: ModernizationType
    current_version: str
    target_version: str
    files_to_modify: int
    estimated_effort_hours: float
    estimated_with_bob_minutes: int
    breaking_changes: List[BreakingChange]
    benefits: List[str]
    risks: List[str]


class ModernizationResult(BaseModel):
    """Result of a modernization"""
    plan_id: str
    status: ModernizationStatus
    files_modified: List[str]
    tests_updated: List[str]
    time_taken_minutes: int
    manual_effort_saved_hours: float
    success_rate: float
    summary: str


class CodeModernizationAgent:
    """Uses Bob to auto-upgrade codebases"""
    
    def __init__(self):
        self.plans: Dict[str, ModernizationPlan] = {}
        self.results: Dict[str, ModernizationResult] = {}
    
    async def analyze_codebase(
        self,
        repo_path: str,
        modernization_type: ModernizationType
    ) -> ModernizationPlan:
        """Analyze codebase and create modernization plan"""
        plan_id = f"mod_{int(datetime.utcnow().timestamp())}"
        
        # Simulate analysis based on modernization type
        plan = self._create_plan(plan_id, modernization_type)
        self.plans[plan_id] = plan
        
        return plan
    
    def _create_plan(
        self,
        plan_id: str,
        mod_type: ModernizationType
    ) -> ModernizationPlan:
        """Create a modernization plan"""
        
        plans_data = {
            ModernizationType.JAVA_8_TO_21: {
                "current": "Java 8",
                "target": "Java 21",
                "files": 45,
                "manual_hours": 40.0,
                "bob_minutes": 120,
                "breaking_changes": [
                    BreakingChange(
                        file="src/main/java/com/example/Utils.java",
                        line=23,
                        description="Date API changed from java.util.Date to java.time",
                        severity="high",
                        auto_fixable=True,
                        suggested_fix="Replace Date with LocalDateTime"
                    ),
                    BreakingChange(
                        file="src/main/java/com/example/Service.java",
                        line=67,
                        description="Removed sun.misc.Unsafe usage",
                        severity="high",
                        auto_fixable=False,
                        suggested_fix="Use VarHandle or MethodHandle instead"
                    ),
                ],
                "benefits": [
                    "Virtual threads for better concurrency",
                    "Pattern matching for cleaner code",
                    "Records for immutable data classes",
                    "Sealed classes for better type safety",
                    "Performance improvements (up to 30% faster)"
                ],
                "risks": [
                    "Breaking changes in deprecated APIs",
                    "Third-party library compatibility",
                    "Build tool updates required"
                ]
            },
            ModernizationType.PYTHON_2_TO_3: {
                "current": "Python 2.7",
                "target": "Python 3.11",
                "files": 32,
                "manual_hours": 25.0,
                "bob_minutes": 90,
                "breaking_changes": [
                    BreakingChange(
                        file="app/utils.py",
                        line=15,
                        description="print statement changed to function",
                        severity="medium",
                        auto_fixable=True,
                        suggested_fix="Add parentheses: print()"
                    ),
                    BreakingChange(
                        file="app/models.py",
                        line=42,
                        description="dict.iteritems() removed",
                        severity="medium",
                        auto_fixable=True,
                        suggested_fix="Use dict.items() instead"
                    ),
                ],
                "benefits": [
                    "Type hints for better code quality",
                    "f-strings for cleaner formatting",
                    "asyncio for async programming",
                    "Performance improvements",
                    "Active security updates"
                ],
                "risks": [
                    "Unicode handling changes",
                    "Integer division behavior",
                    "Library compatibility"
                ]
            },
            ModernizationType.REACT_CLASS_TO_HOOKS: {
                "current": "React 16 (Class Components)",
                "target": "React 18 (Hooks)",
                "files": 28,
                "manual_hours": 18.0,
                "bob_minutes": 75,
                "breaking_changes": [
                    BreakingChange(
                        file="src/components/UserProfile.jsx",
                        line=10,
                        description="componentDidMount lifecycle method",
                        severity="medium",
                        auto_fixable=True,
                        suggested_fix="Convert to useEffect hook"
                    ),
                ],
                "benefits": [
                    "Simpler, more readable code",
                    "Better code reuse with custom hooks",
                    "Smaller bundle size",
                    "Concurrent rendering support",
                    "Automatic batching"
                ],
                "risks": [
                    "Learning curve for team",
                    "Testing strategy changes",
                    "Third-party component compatibility"
                ]
            },
        }
        
        data = plans_data.get(mod_type, plans_data[ModernizationType.JAVA_8_TO_21])
        
        return ModernizationPlan(
            id=plan_id,
            type=mod_type,
            current_version=data["current"],
            target_version=data["target"],
            files_to_modify=data["files"],
            estimated_effort_hours=data["manual_hours"],
            estimated_with_bob_minutes=data["bob_minutes"],
            breaking_changes=data["breaking_changes"],
            benefits=data["benefits"],
            risks=data["risks"]
        )
    
    async def execute_modernization(
        self,
        plan_id: str
    ) -> ModernizationResult:
        """Execute the modernization plan"""
        plan = self.plans.get(plan_id)
        if not plan:
            raise ValueError(f"Plan not found: {plan_id}")
        
        # Simulate execution
        result = ModernizationResult(
            plan_id=plan_id,
            status=ModernizationStatus.COMPLETED,
            files_modified=[
                f"file_{i}.{self._get_extension(plan.type)}"
                for i in range(plan.files_to_modify)
            ],
            tests_updated=[
                f"test_file_{i}.{self._get_test_extension(plan.type)}"
                for i in range(plan.files_to_modify // 3)
            ],
            time_taken_minutes=plan.estimated_with_bob_minutes,
            manual_effort_saved_hours=plan.estimated_effort_hours - (plan.estimated_with_bob_minutes / 60),
            success_rate=0.95,
            summary=self._generate_summary(plan)
        )
        
        self.results[plan_id] = result
        return result
    
    def _get_extension(self, mod_type: ModernizationType) -> str:
        """Get file extension for modernization type"""
        extensions = {
            ModernizationType.JAVA_8_TO_21: "java",
            ModernizationType.PYTHON_2_TO_3: "py",
            ModernizationType.SPRING_TO_BOOT_3: "java",
            ModernizationType.REACT_CLASS_TO_HOOKS: "jsx",
            ModernizationType.NODEJS_14_TO_20: "js",
        }
        return extensions.get(mod_type, "txt")
    
    def _get_test_extension(self, mod_type: ModernizationType) -> str:
        """Get test file extension"""
        return "test." + self._get_extension(mod_type)
    
    def _generate_summary(self, plan: ModernizationPlan) -> str:
        """Generate modernization summary"""
        time_saved_percent = ((plan.estimated_effort_hours * 60 - plan.estimated_with_bob_minutes) / 
                             (plan.estimated_effort_hours * 60) * 100)
        
        return (
            f"Successfully modernized from {plan.current_version} to {plan.target_version}. "
            f"Modified {plan.files_to_modify} files in {plan.estimated_with_bob_minutes} minutes. "
            f"Manual effort would have taken {plan.estimated_effort_hours} hours. "
            f"Time saved: {time_saved_percent:.1f}%"
        )
    
    def get_plan(self, plan_id: str) -> Optional[ModernizationPlan]:
        """Get modernization plan by ID"""
        return self.plans.get(plan_id)
    
    def get_result(self, plan_id: str) -> Optional[ModernizationResult]:
        """Get modernization result by ID"""
        return self.results.get(plan_id)


# Global agent instance
_agent = CodeModernizationAgent()


def get_modernization_agent() -> CodeModernizationAgent:
    """Get the global modernization agent instance"""
    return _agent


# Made with Bob