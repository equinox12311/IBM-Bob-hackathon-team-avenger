"""
Graph-RAG Module
Creates a knowledge graph from diary entries and exports to markdown
"""
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Tuple
from pydantic import BaseModel
import re
from collections import defaultdict


class GraphNode(BaseModel):
    """A node in the knowledge graph"""
    id: str
    type: str  # "entry", "concept", "file", "tag"
    label: str
    properties: Dict[str, Any]
    embedding: Optional[List[float]] = None


class GraphEdge(BaseModel):
    """An edge in the knowledge graph"""
    source: str
    target: str
    type: str  # "references", "similar_to", "contains", "tagged_with"
    weight: float
    properties: Dict[str, Any] = {}


class KnowledgeGraph(BaseModel):
    """Complete knowledge graph"""
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    metadata: Dict[str, Any]


class MarkdownExport(BaseModel):
    """Exported markdown file"""
    filename: str
    content: str
    frontmatter: Dict[str, Any]


class GraphRAG:
    """Graph-RAG system for Cortex entries"""
    
    def __init__(self):
        self.graph: Optional[KnowledgeGraph] = None
    
    def build_graph_from_entries(self, entries: List[Any]) -> KnowledgeGraph:
        """Build knowledge graph from diary entries"""
        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []
        
        # Track concepts and files
        concepts: Dict[str, Set[str]] = defaultdict(set)  # concept -> entry_ids
        files: Dict[str, Set[str]] = defaultdict(set)  # file -> entry_ids
        tags: Dict[str, Set[str]] = defaultdict(set)  # tag -> entry_ids
        
        # Create entry nodes
        for entry in entries:
            entry_id = f"entry_{entry.id}"
            
            # Create entry node
            nodes.append(GraphNode(
                id=entry_id,
                type="entry",
                label=entry.text[:50] + "..." if len(entry.text) > 50 else entry.text,
                properties={
                    "full_text": entry.text,
                    "kind": entry.kind,
                    "source": entry.source,
                    "score": entry.score,
                    "created_at": entry.created_at,
                    "file": entry.file,
                    "repo": entry.repo,
                }
            ))
            
            # Extract concepts (capitalized words, technical terms)
            extracted_concepts = self._extract_concepts(entry.text)
            for concept in extracted_concepts:
                concepts[concept].add(entry_id)
            
            # Track files
            if entry.file:
                files[entry.file].add(entry_id)
            
            # Track tags
            for tag in entry.tags:
                tags[tag].add(entry_id)
        
        # Create concept nodes and edges
        for concept, entry_ids in concepts.items():
            if len(entry_ids) >= 2:  # Only concepts mentioned in 2+ entries
                concept_id = f"concept_{concept.lower().replace(' ', '_')}"
                nodes.append(GraphNode(
                    id=concept_id,
                    type="concept",
                    label=concept,
                    properties={
                        "mention_count": len(entry_ids),
                        "entries": list(entry_ids)
                    }
                ))
                
                # Create edges from entries to concept
                for entry_id in entry_ids:
                    edges.append(GraphEdge(
                        source=entry_id,
                        target=concept_id,
                        type="contains",
                        weight=1.0
                    ))
        
        # Create file nodes and edges
        for file, entry_ids in files.items():
            file_id = f"file_{file.replace('/', '_').replace('.', '_')}"
            nodes.append(GraphNode(
                id=file_id,
                type="file",
                label=file,
                properties={
                    "path": file,
                    "entry_count": len(entry_ids)
                }
            ))
            
            # Create edges from entries to file
            for entry_id in entry_ids:
                edges.append(GraphEdge(
                    source=entry_id,
                    target=file_id,
                    type="references",
                    weight=1.0
                ))
        
        # Create tag nodes and edges
        for tag, entry_ids in tags.items():
            tag_id = f"tag_{tag.lower().replace(' ', '_')}"
            nodes.append(GraphNode(
                id=tag_id,
                type="tag",
                label=tag,
                properties={
                    "entry_count": len(entry_ids)
                }
            ))
            
            # Create edges from entries to tag
            for entry_id in entry_ids:
                edges.append(GraphEdge(
                    source=entry_id,
                    target=tag_id,
                    type="tagged_with",
                    weight=1.0
                ))
        
        # Create similarity edges between entries (based on shared concepts)
        entry_concepts: Dict[str, Set[str]] = defaultdict(set)
        for concept, entry_ids in concepts.items():
            for entry_id in entry_ids:
                entry_concepts[entry_id].add(concept)
        
        entry_ids_list = list(entry_concepts.keys())
        for i, entry_id1 in enumerate(entry_ids_list):
            for entry_id2 in entry_ids_list[i+1:]:
                shared = entry_concepts[entry_id1] & entry_concepts[entry_id2]
                if len(shared) >= 2:  # At least 2 shared concepts
                    similarity = len(shared) / max(len(entry_concepts[entry_id1]), len(entry_concepts[entry_id2]))
                    edges.append(GraphEdge(
                        source=entry_id1,
                        target=entry_id2,
                        type="similar_to",
                        weight=similarity,
                        properties={"shared_concepts": list(shared)}
                    ))
        
        self.graph = KnowledgeGraph(
            nodes=nodes,
            edges=edges,
            metadata={
                "created_at": int(datetime.utcnow().timestamp() * 1000),
                "entry_count": len([n for n in nodes if n.type == "entry"]),
                "concept_count": len([n for n in nodes if n.type == "concept"]),
                "file_count": len([n for n in nodes if n.type == "file"]),
                "tag_count": len([n for n in nodes if n.type == "tag"]),
                "edge_count": len(edges)
            }
        )
        
        return self.graph
    
    def _extract_concepts(self, text: str) -> Set[str]:
        """Extract concepts from text"""
        concepts = set()
        
        # Technical terms (common programming concepts)
        tech_terms = [
            "API", "REST", "GraphQL", "SQL", "NoSQL", "Docker", "Kubernetes",
            "React", "Vue", "Angular", "Python", "JavaScript", "TypeScript",
            "Java", "Spring", "Django", "Flask", "FastAPI", "Node.js",
            "AWS", "Azure", "GCP", "CI/CD", "Git", "GitHub", "GitLab",
            "Redis", "MongoDB", "PostgreSQL", "MySQL", "Elasticsearch",
            "Microservices", "Serverless", "Lambda", "Authentication", "OAuth",
            "JWT", "CORS", "HTTPS", "SSL", "TLS", "Encryption", "Security"
        ]
        
        for term in tech_terms:
            if term.lower() in text.lower():
                concepts.add(term)
        
        # Capitalized phrases (likely proper nouns or concepts)
        capitalized = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
        for phrase in capitalized:
            if len(phrase) > 3 and phrase not in ["The", "This", "That", "These", "Those"]:
                concepts.add(phrase)
        
        # Code-like terms (camelCase, snake_case)
        code_terms = re.findall(r'\b[a-z]+[A-Z][a-zA-Z]*\b|\b[a-z]+_[a-z_]+\b', text)
        for term in code_terms:
            if len(term) > 4:
                concepts.add(term)
        
        return concepts
    
    def export_to_markdown(self, entries: List[Any]) -> List[MarkdownExport]:
        """Export entries to markdown files with frontmatter"""
        exports: List[MarkdownExport] = []
        
        # Group entries by kind
        by_kind: Dict[str, List[Any]] = defaultdict(list)
        for entry in entries:
            by_kind[entry.kind].append(entry)
        
        # Create index file
        index_content = self._create_index_markdown(entries, by_kind)
        exports.append(MarkdownExport(
            filename="index.md",
            content=index_content,
            frontmatter={
                "title": "Cortex Knowledge Base",
                "generated_at": datetime.utcnow().isoformat(),
                "total_entries": len(entries)
            }
        ))
        
        # Create individual entry files
        for entry in entries:
            filename = f"{entry.kind}/{entry.id}_{self._slugify(entry.text[:30])}.md"
            content = self._create_entry_markdown(entry)
            exports.append(MarkdownExport(
                filename=filename,
                content=content,
                frontmatter={
                    "id": entry.id,
                    "kind": entry.kind,
                    "source": entry.source,
                    "created_at": datetime.fromtimestamp(entry.created_at / 1000).isoformat(),
                    "score": entry.score,
                    "tags": entry.tags,
                    "file": entry.file,
                    "repo": entry.repo
                }
            ))
        
        # Create kind summary files
        for kind, kind_entries in by_kind.items():
            filename = f"{kind}/README.md"
            content = self._create_kind_summary(kind, kind_entries)
            exports.append(MarkdownExport(
                filename=filename,
                content=content,
                frontmatter={
                    "kind": kind,
                    "entry_count": len(kind_entries),
                    "generated_at": datetime.utcnow().isoformat()
                }
            ))
        
        # Create graph visualization file
        if self.graph:
            graph_content = self._create_graph_markdown(self.graph)
            exports.append(MarkdownExport(
                filename="graph.md",
                content=graph_content,
                frontmatter={
                    "title": "Knowledge Graph",
                    "node_count": len(self.graph.nodes),
                    "edge_count": len(self.graph.edges)
                }
            ))
        
        return exports
    
    def _create_index_markdown(self, entries: List[Any], by_kind: Dict[str, List[Any]]) -> str:
        """Create index markdown"""
        content = "# Cortex Knowledge Base\n\n"
        content += f"**Total Entries**: {len(entries)}\n\n"
        content += f"**Generated**: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC\n\n"
        
        content += "## Entries by Kind\n\n"
        for kind, kind_entries in sorted(by_kind.items()):
            content += f"- **{kind.title()}**: {len(kind_entries)} entries → [{kind}/README.md]({kind}/README.md)\n"
        
        content += "\n## Recent Entries\n\n"
        recent = sorted(entries, key=lambda e: e.created_at, reverse=True)[:10]
        for entry in recent:
            date = datetime.fromtimestamp(entry.created_at / 1000).strftime('%Y-%m-%d')
            slug = self._slugify(entry.text[:30])
            content += f"- [{date}] [{entry.text[:60]}...]({entry.kind}/{entry.id}_{slug}.md)\n"
        
        content += "\n## Knowledge Graph\n\n"
        content += "View the [Knowledge Graph](graph.md) to see connections between entries.\n"
        
        return content
    
    def _create_entry_markdown(self, entry: Any) -> str:
        """Create markdown for a single entry"""
        content = f"# {entry.text[:60]}\n\n"
        
        content += "## Metadata\n\n"
        content += f"- **ID**: {entry.id}\n"
        content += f"- **Kind**: {entry.kind}\n"
        content += f"- **Source**: {entry.source}\n"
        content += f"- **Created**: {datetime.fromtimestamp(entry.created_at / 1000).strftime('%Y-%m-%d %H:%M:%S')}\n"
        content += f"- **Score**: {entry.score}\n"
        
        if entry.tags:
            content += f"- **Tags**: {', '.join(entry.tags)}\n"
        
        if entry.file:
            content += f"- **File**: `{entry.file}`"
            if entry.line_start:
                content += f" (lines {entry.line_start}-{entry.line_end})"
            content += "\n"
        
        if entry.repo:
            content += f"- **Repo**: {entry.repo}\n"
        
        content += "\n## Content\n\n"
        content += entry.text + "\n"
        
        return content
    
    def _create_kind_summary(self, kind: str, entries: List[Any]) -> str:
        """Create summary markdown for a kind"""
        content = f"# {kind.title()} Entries\n\n"
        content += f"**Total**: {len(entries)} entries\n\n"
        
        content += "## All Entries\n\n"
        sorted_entries = sorted(entries, key=lambda e: e.created_at, reverse=True)
        for entry in sorted_entries:
            date = datetime.fromtimestamp(entry.created_at / 1000).strftime('%Y-%m-%d')
            slug = self._slugify(entry.text[:30])
            content += f"- [{date}] [{entry.text[:80]}...]({entry.id}_{slug}.md)\n"
        
        return content
    
    def _create_graph_markdown(self, graph: KnowledgeGraph) -> str:
        """Create graph visualization markdown"""
        content = "# Knowledge Graph\n\n"
        content += f"**Nodes**: {len(graph.nodes)}\n"
        content += f"**Edges**: {len(graph.edges)}\n\n"
        
        content += "## Statistics\n\n"
        content += f"- **Entries**: {graph.metadata['entry_count']}\n"
        content += f"- **Concepts**: {graph.metadata['concept_count']}\n"
        content += f"- **Files**: {graph.metadata['file_count']}\n"
        content += f"- **Tags**: {graph.metadata['tag_count']}\n\n"
        
        content += "## Mermaid Diagram\n\n"
        content += "```mermaid\n"
        content += "graph TD\n"
        
        # Add nodes (limit to top concepts and files)
        concept_nodes = [n for n in graph.nodes if n.type == "concept"][:20]
        file_nodes = [n for n in graph.nodes if n.type == "file"][:10]
        
        for node in concept_nodes:
            content += f"    {node.id}[{node.label}]\n"
        
        for node in file_nodes:
            content += f"    {node.id}[{node.label}]\n"
        
        # Add edges (limit to high-weight edges)
        high_weight_edges = sorted([e for e in graph.edges if e.weight > 0.5], 
                                   key=lambda e: e.weight, reverse=True)[:50]
        
        for edge in high_weight_edges:
            if edge.source in [n.id for n in concept_nodes + file_nodes] and \
               edge.target in [n.id for n in concept_nodes + file_nodes]:
                content += f"    {edge.source} --> {edge.target}\n"
        
        content += "```\n\n"
        
        content += "## Top Concepts\n\n"
        sorted_concepts = sorted(concept_nodes, 
                                key=lambda n: n.properties.get('mention_count', 0), 
                                reverse=True)[:20]
        for node in sorted_concepts:
            content += f"- **{node.label}**: mentioned in {node.properties['mention_count']} entries\n"
        
        return content
    
    def _slugify(self, text: str) -> str:
        """Convert text to URL-friendly slug"""
        text = text.lower()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[\s_-]+', '-', text)
        text = re.sub(r'^-+|-+$', '', text)
        return text[:50]
    
    def get_graph(self) -> Optional[KnowledgeGraph]:
        """Get the current knowledge graph"""
        return self.graph


# Global instance
_graph_rag = GraphRAG()


def get_graph_rag() -> GraphRAG:
    """Get the global Graph-RAG instance"""
    return _graph_rag


# Made with Bob