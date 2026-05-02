"""
Multi-Agent Bob Orchestration Module
Orchestrates multiple Bob agents for complex workflows
"""
from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel
from enum import Enum


class AgentType(str, Enum):
    """Types of Bob agents"""
    PLANNER = "planner"
    CODER = "coder"
    REVIEWER = "reviewer"
    DOCUMENTER = "documenter"
    TESTER = "tester"


class AgentStatus(str, Enum):
    """Agent execution status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class AgentStep(BaseModel):
    """A single step in the workflow"""
    agent_type: AgentType
    status: AgentStatus
    input: str
    output: Optional[str] = None
    duration_seconds: Optional[float] = None
    error: Optional[str] = None


class WorkflowResult(BaseModel):
    """Result of a multi-agent workflow"""
    workflow_id: str
    workflow_name: str
    status: AgentStatus
    steps: List[AgentStep]
    total_duration_seconds: float
    files_modified: List[str]
    summary: str


class WorkflowTemplate(BaseModel):
    """Pre-built workflow template"""
    id: str
    name: str
    description: str
    agents: List[AgentType]
    estimated_time_minutes: int
    example_use_case: str


# Pre-built workflow templates
WORKFLOW_TEMPLATES = [
    WorkflowTemplate(
        id="feature-with-tests",
        name="Add Feature with Tests",
        description="Plan, implement, test, and document a new feature",
        agents=[AgentType.PLANNER, AgentType.CODER, AgentType.TESTER, AgentType.DOCUMENTER],
        estimated_time_minutes=15,
        example_use_case="Add user authentication feature"
    ),
    WorkflowTemplate(
        id="security-audit",
        name="Security Audit",
        description="Review code for security vulnerabilities and fix issues",
        agents=[AgentType.REVIEWER, AgentType.CODER, AgentType.TESTER],
        estimated_time_minutes=10,
        example_use_case="Audit API endpoints for SQL injection"
    ),
    WorkflowTemplate(
        id="refactor-optimize",
        name="Refactor & Optimize",
        description="Analyze, refactor, and optimize code performance",
        agents=[AgentType.PLANNER, AgentType.CODER, AgentType.TESTER, AgentType.DOCUMENTER],
        estimated_time_minutes=20,
        example_use_case="Optimize database queries"
    ),
    WorkflowTemplate(
        id="bug-fix-complete",
        name="Complete Bug Fix",
        description="Diagnose, fix, test, and document a bug",
        agents=[AgentType.PLANNER, AgentType.CODER, AgentType.TESTER, AgentType.DOCUMENTER],
        estimated_time_minutes=12,
        example_use_case="Fix memory leak in background worker"
    ),
]


class BobAgentOrchestrator:
    """Orchestrates multiple Bob agents for complex workflows"""
    
    def __init__(self):
        self.workflows: Dict[str, WorkflowResult] = {}
    
    async def execute_workflow(
        self,
        template_id: str,
        task_description: str
    ) -> WorkflowResult:
        """Execute a workflow using the specified template"""
        template = next((t for t in WORKFLOW_TEMPLATES if t.id == template_id), None)
        if not template:
            raise ValueError(f"Unknown template: {template_id}")
        
        workflow_id = f"wf_{int(datetime.utcnow().timestamp())}"
        
        # Simulate workflow execution
        steps: List[AgentStep] = []
        total_duration = 0.0
        
        for agent_type in template.agents:
            step = await self._execute_agent_step(agent_type, task_description)
            steps.append(step)
            total_duration += step.duration_seconds or 0
        
        result = WorkflowResult(
            workflow_id=workflow_id,
            workflow_name=template.name,
            status=AgentStatus.COMPLETED,
            steps=steps,
            total_duration_seconds=total_duration,
            files_modified=self._get_modified_files(steps),
            summary=self._generate_summary(template, steps)
        )
        
        self.workflows[workflow_id] = result
        return result
    
    async def _execute_agent_step(
        self,
        agent_type: AgentType,
        task: str
    ) -> AgentStep:
        """Execute a single agent step (simulated)"""
        # In production, this would call actual Bob agents
        # For demo, return realistic mock data
        
        outputs = {
            AgentType.PLANNER: f"Created implementation plan for: {task}\n- Break down into 3 subtasks\n- Identify dependencies\n- Estimate 2 hours",
            AgentType.CODER: f"Implemented solution for: {task}\n- Added 5 new functions\n- Modified 3 existing files\n- Follows best practices",
            AgentType.REVIEWER: f"Security review completed for: {task}\n- No vulnerabilities found\n- Code quality: A\n- Test coverage: 95%",
            AgentType.DOCUMENTER: f"Documentation generated for: {task}\n- API docs updated\n- README updated\n- Added code comments",
            AgentType.TESTER: f"Tests created for: {task}\n- 12 unit tests added\n- 3 integration tests added\n- All tests passing",
        }
        
        durations = {
            AgentType.PLANNER: 45.0,
            AgentType.CODER: 180.0,
            AgentType.REVIEWER: 90.0,
            AgentType.DOCUMENTER: 60.0,
            AgentType.TESTER: 120.0,
        }
        
        return AgentStep(
            agent_type=agent_type,
            status=AgentStatus.COMPLETED,
            input=task,
            output=outputs[agent_type],
            duration_seconds=durations[agent_type]
        )
    
    def _get_modified_files(self, steps: List[AgentStep]) -> List[str]:
        """Extract modified files from agent steps"""
        # Mock file list based on agent types
        files = []
        for step in steps:
            if step.agent_type == AgentType.CODER:
                files.extend(["src/main.py", "src/utils.py", "src/models.py"])
            elif step.agent_type == AgentType.TESTER:
                files.extend(["tests/test_main.py", "tests/test_utils.py"])
            elif step.agent_type == AgentType.DOCUMENTER:
                files.extend(["README.md", "docs/API.md"])
        return list(set(files))
    
    def _generate_summary(
        self,
        template: WorkflowTemplate,
        steps: List[AgentStep]
    ) -> str:
        """Generate workflow summary"""
        completed = sum(1 for s in steps if s.status == AgentStatus.COMPLETED)
        total_time = sum(s.duration_seconds or 0 for s in steps)
        
        return (
            f"{template.name} workflow completed successfully. "
            f"{completed}/{len(steps)} agents completed in {total_time/60:.1f} minutes. "
            f"Manual effort would have taken ~{template.estimated_time_minutes * 60} minutes. "
            f"Time saved: {(template.estimated_time_minutes * 60 - total_time)/60:.1f} minutes."
        )
    
    def get_workflow(self, workflow_id: str) -> Optional[WorkflowResult]:
        """Get workflow result by ID"""
        return self.workflows.get(workflow_id)
    
    def list_workflows(self) -> List[WorkflowResult]:
        """List all workflows"""
        return list(self.workflows.values())


# Global orchestrator instance
_orchestrator = BobAgentOrchestrator()


def get_orchestrator() -> BobAgentOrchestrator:
    """Get the global orchestrator instance"""
    return _orchestrator


def get_workflow_templates() -> List[WorkflowTemplate]:
    """Get all available workflow templates"""
    return WORKFLOW_TEMPLATES


# Made with Bob