"""
Legacy Codebase Analyzer Module
Bob analyzes undocumented legacy code and generates documentation
"""
from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel


class CodeComplexity(BaseModel):
    """Code complexity metrics"""
    cyclomatic_complexity: int
    cognitive_complexity: int
    lines_of_code: int
    comment_ratio: float
    technical_debt_hours: float


class APIEndpoint(BaseModel):
    """Discovered API endpoint"""
    method: str
    path: str
    description: str
    parameters: List[Dict[str, str]]
    response_type: str


class ArchitectureComponent(BaseModel):
    """Architecture component"""
    name: str
    type: str  # "service", "database", "queue", "cache", etc.
    description: str
    dependencies: List[str]
    technologies: List[str]


class MigrationStep(BaseModel):
    """Step in migration plan"""
    order: int
    title: str
    description: str
    estimated_hours: float
    risk_level: str  # "low", "medium", "high"
    dependencies: List[int]  # step numbers


class LegacyAnalysis(BaseModel):
    """Complete analysis of a legacy codebase"""
    id: str
    repo_url: str
    analyzed_at: int  # unix epoch ms
    complexity: CodeComplexity
    architecture_diagram: str  # Mermaid diagram
    api_docs: List[APIEndpoint]
    migration_plan: List[MigrationStep]
    test_coverage: float
    documentation_coverage: float
    recommendations: List[str]
    summary: str


class LegacyCodebaseAnalyzer:
    """Bob analyzes undocumented legacy code"""
    
    def __init__(self):
        self.analyses: Dict[str, LegacyAnalysis] = {}
    
    async def analyze_legacy_repo(
        self,
        repo_url: str
    ) -> LegacyAnalysis:
        """Analyze a legacy repository"""
        analysis_id = f"legacy_{int(datetime.utcnow().timestamp())}"
        
        # Simulate Bob analyzing the repo
        analysis = LegacyAnalysis(
            id=analysis_id,
            repo_url=repo_url,
            analyzed_at=int(datetime.utcnow().timestamp() * 1000),
            complexity=self._analyze_complexity(),
            architecture_diagram=self._generate_architecture_diagram(),
            api_docs=self._discover_api_endpoints(),
            migration_plan=self._create_migration_plan(),
            test_coverage=0.23,  # 23% coverage (typical for legacy)
            documentation_coverage=0.05,  # 5% documented
            recommendations=self._generate_recommendations(),
            summary=self._generate_summary()
        )
        
        self.analyses[analysis_id] = analysis
        return analysis
    
    def _analyze_complexity(self) -> CodeComplexity:
        """Analyze code complexity"""
        return CodeComplexity(
            cyclomatic_complexity=47,  # High complexity
            cognitive_complexity=89,   # Very high
            lines_of_code=45_000,
            comment_ratio=0.08,  # 8% comments (low)
            technical_debt_hours=320.0  # Estimated debt
        )
    
    def _generate_architecture_diagram(self) -> str:
        """Generate Mermaid architecture diagram"""
        return '''```mermaid
graph TB
    A[Web Frontend<br/>JSP/Servlets] --> B[Application Server<br/>Tomcat 7]
    B --> C[Business Logic<br/>EJB 2.1]
    C --> D[Database<br/>Oracle 11g]
    C --> E[Message Queue<br/>ActiveMQ]
    B --> F[Cache<br/>Ehcache]
    G[Batch Jobs<br/>Quartz] --> C
    H[External API<br/>SOAP] --> B
    
    style A fill:#f9f,stroke:#333
    style B fill:#bbf,stroke:#333
    style C fill:#bfb,stroke:#333
    style D fill:#fbb,stroke:#333
```'''
    
    def _discover_api_endpoints(self) -> List[APIEndpoint]:
        """Discover API endpoints from code"""
        return [
            APIEndpoint(
                method="GET",
                path="/api/users/{id}",
                description="Retrieve user by ID",
                parameters=[
                    {"name": "id", "type": "integer", "required": "true"}
                ],
                response_type="User"
            ),
            APIEndpoint(
                method="POST",
                path="/api/users",
                description="Create new user",
                parameters=[
                    {"name": "body", "type": "User", "required": "true"}
                ],
                response_type="User"
            ),
            APIEndpoint(
                method="PUT",
                path="/api/users/{id}",
                description="Update existing user",
                parameters=[
                    {"name": "id", "type": "integer", "required": "true"},
                    {"name": "body", "type": "User", "required": "true"}
                ],
                response_type="User"
            ),
            APIEndpoint(
                method="DELETE",
                path="/api/users/{id}",
                description="Delete user",
                parameters=[
                    {"name": "id", "type": "integer", "required": "true"}
                ],
                response_type="void"
            ),
            APIEndpoint(
                method="GET",
                path="/api/orders",
                description="List all orders with pagination",
                parameters=[
                    {"name": "page", "type": "integer", "required": "false"},
                    {"name": "size", "type": "integer", "required": "false"}
                ],
                response_type="OrderList"
            ),
        ]
    
    def _create_migration_plan(self) -> List[MigrationStep]:
        """Create migration plan"""
        return [
            MigrationStep(
                order=1,
                title="Set up modern development environment",
                description="Install Java 21, Spring Boot 3, modern IDE plugins",
                estimated_hours=4.0,
                risk_level="low",
                dependencies=[]
            ),
            MigrationStep(
                order=2,
                title="Add comprehensive test coverage",
                description="Write unit and integration tests for critical paths (target 80% coverage)",
                estimated_hours=40.0,
                risk_level="medium",
                dependencies=[1]
            ),
            MigrationStep(
                order=3,
                title="Migrate from EJB 2.1 to Spring Boot",
                description="Replace EJB components with Spring services and repositories",
                estimated_hours=60.0,
                risk_level="high",
                dependencies=[1, 2]
            ),
            MigrationStep(
                order=4,
                title="Upgrade database driver and queries",
                description="Update Oracle driver, migrate to JPA/Hibernate, optimize queries",
                estimated_hours=24.0,
                risk_level="high",
                dependencies=[3]
            ),
            MigrationStep(
                order=5,
                title="Replace JSP with modern frontend",
                description="Migrate JSP pages to React or Vue.js",
                estimated_hours=80.0,
                risk_level="medium",
                dependencies=[3]
            ),
            MigrationStep(
                order=6,
                title="Implement REST API",
                description="Replace SOAP with RESTful API using Spring Web",
                estimated_hours=32.0,
                risk_level="medium",
                dependencies=[3]
            ),
            MigrationStep(
                order=7,
                title="Add monitoring and observability",
                description="Integrate Prometheus, Grafana, distributed tracing",
                estimated_hours=16.0,
                risk_level="low",
                dependencies=[3, 6]
            ),
            MigrationStep(
                order=8,
                title="Security hardening",
                description="Update dependencies, fix vulnerabilities, add security headers",
                estimated_hours=20.0,
                risk_level="high",
                dependencies=[3, 6]
            ),
        ]
    
    def _generate_recommendations(self) -> List[str]:
        """Generate recommendations"""
        return [
            "🔴 CRITICAL: Upgrade from Java 8 to Java 21 (security vulnerabilities)",
            "🔴 CRITICAL: Replace EJB 2.1 with Spring Boot 3 (unsupported technology)",
            "🟡 HIGH: Increase test coverage from 23% to 80%",
            "🟡 HIGH: Add API documentation (currently 0%)",
            "🟡 HIGH: Refactor high-complexity modules (cyclomatic > 40)",
            "🟢 MEDIUM: Migrate from JSP to modern frontend framework",
            "🟢 MEDIUM: Replace SOAP with REST API",
            "🟢 MEDIUM: Add monitoring and observability",
            "🔵 LOW: Improve code comments (currently 8%)",
            "🔵 LOW: Set up CI/CD pipeline",
        ]
    
    def _generate_summary(self) -> str:
        """Generate analysis summary"""
        return (
            "This 10-year-old codebase has 45,000 lines with minimal documentation (5%) "
            "and low test coverage (23%). The architecture uses outdated technologies "
            "(EJB 2.1, JSP, Java 8) that are no longer supported. "
            "Estimated technical debt: 320 hours. "
            "Bob has generated complete documentation including architecture diagrams, "
            "API docs, and a detailed 8-step migration plan. "
            "With Bob's assistance, modernization can be completed in ~276 hours "
            "vs ~500+ hours manually (45% time savings)."
        )
    
    def get_analysis(self, analysis_id: str) -> Optional[LegacyAnalysis]:
        """Get analysis by ID"""
        return self.analyses.get(analysis_id)
    
    def list_analyses(self) -> List[LegacyAnalysis]:
        """List all analyses"""
        return list(self.analyses.values())


# Global analyzer instance
_analyzer = LegacyCodebaseAnalyzer()


def get_legacy_analyzer() -> LegacyCodebaseAnalyzer:
    """Get the global legacy analyzer instance"""
    return _analyzer


# Made with Bob