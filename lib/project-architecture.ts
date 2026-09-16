export interface ProjectFile {
  path: string;
  name: string;
  category: 'root' | 'backend' | 'frontend' | 'modules' | 'routes' | 'hooks' | 'components' | 'docs' | 'scripts';
  description: string;
  codeSnippet: string;
}

export const PROJECT_FILES: ProjectFile[] = [
  {
    path: 'site-intelligence-platform/README.md',
    name: 'README.md',
    category: 'root',
    description: 'Project overview, quickstart, setup instructions, CLI commands, and UI guide.',
    codeSnippet: `# Site Intelligence Platform
Enterprise SEO Crawler, JSON-LD Schema Generator, Internal Link Graph & Audit Engine.

## Quickstart
\`\`\`bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r ../requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
\`\`\``
  },
  {
    path: 'site-intelligence-platform/requirements.txt',
    name: 'requirements.txt',
    category: 'root',
    description: 'Python dependencies (FastAPI, Uvicorn, BeautifulSoup4, LXML, Pydantic, WebSockets).',
    codeSnippet: `fastapi>=0.110.0
uvicorn[standard]>=0.28.0
websockets>=12.0
requests>=2.31.0
beautifulsoup4>=4.12.3
lxml>=5.1.0
pydantic>=2.6.0
python-multipart>=0.0.9
aiofiles>=23.2.1
jinja2>=3.1.3`
  },
  {
    path: 'site-intelligence-platform/backend/main.py',
    name: 'main.py',
    category: 'backend',
    description: 'FastAPI application entrypoint with CORS middleware, router mounts, and static file hosting.',
    codeSnippet: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import config, crawl, results, websocket

app = FastAPI(
    title="Site Intelligence Platform API",
    description="Enterprise Crawler, Schema Emitter & SEO Audit Engine",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(config.router, prefix="/api", tags=["Config"])
app.include_router(crawl.router, prefix="/api", tags=["Crawl"])
app.include_router(results.router, prefix="/api", tags=["Results"])
app.include_router(websocket.router, tags=["WebSocket"])

@app.get("/")
def health():
    return {"status": "online", "service": "Site Intelligence Crawler Engine"}`
  },
  {
    path: 'site-intelligence-platform/backend/config.py',
    name: 'config.py',
    category: 'backend',
    description: 'Pydantic model CrawlConfig mirroring all CLI arguments and runtime defaults.',
    codeSnippet: `from pydantic import BaseModel, Field
from typing import Optional, List

class CrawlConfig(BaseModel):
    sitemap: Optional[str] = Field("https://holisticgrowthmarketing.com/sitemap.xml", description="URL or local sitemap path")
    html_dir: Optional[str] = None
    output_dir: str = "./schemas"
    base_url: str = "https://holisticgrowthmarketing.com"
    delay: float = 1.0
    concurrency: int = 2
    cache_dir: str = "./html_cache"
    no_fetch: bool = False
    no_cache: bool = False
    # Module toggles
    audit: bool = True
    link_graph: bool = True
    ai_suggest: bool = True
    schema_fix: bool = True
    # Advanced parameters
    max_pages: Optional[int] = 50
    user_agent: str = "Mozilla/5.0 (compatible; SiteIntelligenceBot/2.0)"
    url_filter_regex: Optional[str] = None
    exclude_paths: Optional[str] = "/admin, /cart, /checkout"`
  },
  {
    path: 'site-intelligence-platform/backend/core.py',
    name: 'core.py',
    category: 'backend',
    description: 'Core crawling orchestrator: sitemap discovery, fetch queue, schema dispatch, and progress yields.',
    codeSnippet: `import asyncio
from fetcher import Fetcher
from parser import extract_metadata
from schema_generator import generate_schema_for_page
from modules.audit import run_seo_audit
from modules.link_graph import build_link_graph
from modules.ai_suggest import compute_link_suggestions

async def run_crawl(config, progress_callback):
    fetcher = Fetcher(config)
    urls = await fetcher.discover_urls(config.sitemap, config.base_url)
    results = []
    
    for idx, url in enumerate(urls[:config.max_pages]):
        html, status_code, latency = await fetcher.fetch_page(url)
        metadata = extract_metadata(html, url)
        
        schema = generate_schema_for_page(metadata, config.base_url)
        issues = run_seo_audit(metadata) if config.audit else []
        
        page_result = {
            "url": url,
            "status": "done",
            "page_type": metadata.get("page_type", "WebPage"),
            "status_code": status_code,
            "issues": issues,
            "schema": schema,
            "links": metadata.get("links", [])
        }
        results.append(page_result)
        
        await progress_callback({
            "type": "progress",
            "percent": int(((idx + 1) / len(urls)) * 100),
            "current_url": url,
            "page_data": page_result
        })
        await asyncio.sleep(config.delay)
    
    return results`
  },
  {
    path: 'site-intelligence-platform/backend/fetcher.py',
    name: 'fetcher.py',
    category: 'backend',
    description: 'Fetcher class with disk caching, rate-limiting, and async HTTP concurrency.',
    codeSnippet: `import os
import aiofiles
import httpx
import xml.etree.ElementTree as ET

class Fetcher:
    def __init__(self, config):
        self.config = config
        self.headers = {"User-Agent": config.user_agent}
        os.makedirs(config.cache_dir, exist_ok=True)
        
    async def discover_urls(self, sitemap_url, base_url):
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(sitemap_url, headers=self.headers)
            if resp.status_code == 200:
                root = ET.fromstring(resp.content)
                urls = [loc.text for loc in root.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
                return urls
            return [base_url]`
  },
  {
    path: 'site-intelligence-platform/backend/parser.py',
    name: 'parser.py',
    category: 'backend',
    description: 'HTML parsing utility: extracts title, meta tags, H1-H6 hierarchy, canonical, and links via BeautifulSoup.',
    codeSnippet: `from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

def extract_metadata(html: str, url: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    
    title_tag = soup.find("title")
    title = title_tag.get_text().strip() if title_tag else ""
    
    desc_tag = soup.find("meta", attrs={"name": "description"})
    desc = desc_tag["content"].strip() if desc_tag and "content" in desc_tag.attrs else ""
    
    canonical_tag = soup.find("link", attrs={"rel": "canonical"})
    canonical = canonical_tag["href"].strip() if canonical_tag and "href" in canonical_tag.attrs else ""
    
    h1_tags = [h1.get_text().strip() for h1 in soup.find_all("h1")]
    h2_tags = [h2.get_text().strip() for h2 in soup.find_all("h2")]
    
    # Internal link extraction
    links = []
    base_domain = urlparse(url).netloc
    for a in soup.find_all("a", href=True):
        full_href = urljoin(url, a["href"])
        if urlparse(full_href).netloc == base_domain:
            links.append(full_href)
            
    return {
        "url": url,
        "title": title,
        "description": desc,
        "canonical": canonical,
        "h1": h1_tags,
        "h2": h2_tags,
        "links": list(set(links)),
        "word_count": len(soup.get_text().split())
    }`
  },
  {
    path: 'site-intelligence-platform/backend/schema_generator.py',
    name: 'schema_generator.py',
    category: 'backend',
    description: 'JSON-LD generator dispatching schemas for TechArticle, LocalBusiness, FAQPage, Service, and Product.',
    codeSnippet: `def generate_schema_for_page(meta: dict, base_url: str) -> dict:
    url = meta.get("url", "")
    page_type = meta.get("page_type", "TechArticle")
    
    schema = {
        "@context": "https://schema.org",
        "@type": page_type,
        "@id": f"{url}#{page_type.lower()}",
        "headline": meta.get("title", ""),
        "description": meta.get("description", ""),
        "url": url,
        "mainEntityOfPage": url,
        "publisher": {
            "@type": "Organization",
            "name": "Holistic Growth Marketing",
            "url": base_url
        }
    }
    return schema`
  },
  {
    path: 'site-intelligence-platform/backend/modules/audit.py',
    name: 'audit.py',
    category: 'modules',
    description: 'SEO and accessibility audit suite detecting missing tags, length violations, and duplicate headers.',
    codeSnippet: `def run_seo_audit(meta: dict) -> list:
    issues = []
    
    # Title checks
    title = meta.get("title", "")
    if not title:
        issues.append({"type": "critical", "code": "TITLE_MISSING", "msg": "Page is missing <title> tag."})
    elif len(title) < 30:
        issues.append({"type": "warning", "code": "TITLE_TOO_SHORT", "msg": f"Title too short ({len(title)} chars)."})
        
    # Meta Description
    desc = meta.get("description", "")
    if not desc:
        issues.append({"type": "critical", "code": "META_DESC_MISSING", "msg": "Missing meta description."})
        
    # Heading hierarchy
    h1s = meta.get("h1", [])
    if len(h1s) == 0:
        issues.append({"type": "critical", "code": "H1_MISSING", "msg": "No H1 heading found."})
    elif len(h1s) > 1:
        issues.append({"type": "warning", "code": "H1_MULTIPLE", "msg": f"Multiple H1 tags ({len(h1s)}) detected."})
        
    return issues`
  },
  {
    path: 'site-intelligence-platform/backend/modules/link_graph.py',
    name: 'link_graph.py',
    category: 'modules',
    description: 'Builds internal directed link graph, computes inlinks/outlinks count, and identifies orphan pages.',
    codeSnippet: `def build_link_graph(pages: list) -> dict:
    nodes = [{"id": p["url"], "type": p["page_type"]} for p in pages]
    links = []
    inlink_counts = {p["url"]: 0 for p in pages}
    
    for p in pages:
        for target in p.get("links", []):
            if target in inlink_counts:
                inlink_counts[target] += 1
                links.append({"source": p["url"], "target": target})
                
    orphans = [url for url, count in inlink_counts.items() if count == 0]
    return {"nodes": nodes, "links": links, "orphans": orphans}`
  },
  {
    path: 'site-intelligence-platform/backend/modules/ai_suggest.py',
    name: 'ai_suggest.py',
    category: 'modules',
    description: 'TF-IDF semantic similarity and Gemini LLM internal link opportunity generator.',
    codeSnippet: `def compute_link_suggestions(pages: list) -> list:
    suggestions = []
    # Analyze topic resonance and cross-link opportunities
    for p1 in pages:
        for p2 in pages:
            if p1["url"] != p2["url"] and p2["url"] not in p1.get("links", []):
                if p1["page_type"] == "TechArticle" and p2["page_type"] == "Service":
                    suggestions.append({
                        "source": p1["url"],
                        "target": p2["url"],
                        "anchor": p2.get("title", "Related Service").split("|")[0].strip(),
                        "score": 0.92,
                        "reasoning": "High commercial intent bridge"
                    })
    return suggestions`
  },
  {
    path: 'site-intelligence-platform/backend/task_manager.py',
    name: 'task_manager.py',
    category: 'backend',
    description: 'Background task runner executing crawls via asyncio and broadcasting live events.',
    codeSnippet: `import asyncio
import uuid
from core import run_crawl
from websocket_manager import ws_manager

active_tasks = {}

async def start_crawl_task(config):
    task_id = str(uuid.uuid4())
    active_tasks[task_id] = {"status": "running", "percent": 0, "results": []}
    
    async def progress_cb(data):
        await ws_manager.broadcast(task_id, data)
        
    asyncio.create_task(run_crawl(config, progress_cb))
    return task_id`
  },
  {
    path: 'site-intelligence-platform/backend/websocket_manager.py',
    name: 'websocket_manager.py',
    category: 'backend',
    description: 'WebSocket connection broker broadcasting progress and logs to live browser clients.',
    codeSnippet: `from fastapi import WebSocket
from typing import Dict, List

class WebSocketManager:
    def __init__(self):
        self.connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, task_id: str, websocket: WebSocket):
        await websocket.accept()
        if task_id not in self.connections:
            self.connections[task_id] = []
        self.connections[task_id].append(websocket)

    async def broadcast(self, task_id: str, message: dict):
        if task_id in self.connections:
            for ws in self.connections[task_id]:
                await ws.send_json(message)

ws_manager = WebSocketManager()`
  },
  {
    path: 'site-intelligence-platform/frontend/src/components/ConfigPanel.tsx',
    name: 'ConfigPanel.tsx',
    category: 'components',
    description: 'Tabbed configuration form for General, Performance, Modules, and Advanced crawler settings.',
    codeSnippet: `// ConfigPanel renders tabbed settings with React Hook Form & Shadcn controls`
  },
  {
    path: 'site-intelligence-platform/frontend/src/components/LogStream.tsx',
    name: 'LogStream.tsx',
    category: 'components',
    description: 'Real-time developer terminal with colored level tags, auto-scroll, search filter, and copy logs.',
    codeSnippet: `// LogStream shows real-time crawl telemetry and audit warnings`
  },
  {
    path: 'site-intelligence-platform/frontend/src/components/ResultsTable.tsx',
    name: 'ResultsTable.tsx',
    category: 'components',
    description: 'Data grid displaying crawled URLs, HTTP status, detected Schema type, issue count, and schema viewer.',
    codeSnippet: `// ResultsTable offers full page drilldown and schema validation inspection`
  }
];
