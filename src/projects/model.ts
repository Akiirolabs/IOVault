export type ProjectStatus = "Active" | "In progress" | "Done";
export type ProjectColumnType = "text" | "number" | "date" | "checkbox" | "select";

export type ProjectTable = {
  columns: Array<{ id: string; name: string; type: ProjectColumnType; options?: string[] }>;
  rows: Array<{ id: string; cells: Record<string, string | boolean> }>;
};

export type ProjectFlowchart = {
  nodes: Array<{ id: string; label: string; x: number; y: number; width: number; height: number; color: string; pageText?: string }>;
  edges: Array<{ id: string; source: string; target: string; label: string }>;
  zoom: number;
};

export type ProjectMindmap = {
  objects: Array<{ id: string; title: string; x: number; y: number; width: number; height: number; color: string; pageText?: string; parentId?: string; relationIds: string[]; fields: Array<{ id: string; key: string; value: string }> }>;
};

export type ProjectBlock = {
  id: string;
  title: string;
  status: ProjectStatus;
  body: string;
  docHtml?: string;
  docMarkdown?: string;
  table?: ProjectTable;
  flowchart?: ProjectFlowchart;
  mindmap?: ProjectMindmap;
};

export function createProjectTable(): ProjectTable {
  return { columns: [{ id: "name", name: "Name", type: "text" }], rows: [], };
}

export function createProjectFlowchart(): ProjectFlowchart {
  return { nodes: [], edges: [], zoom: 1 };
}

export function createProjectMindmap(): ProjectMindmap {
  return { objects: [], };
}

export type ProjectFilter = "all" | "active" | "progress" | "done";

export function filterProjects(blocks: ProjectBlock[], filter: ProjectFilter) {
  return blocks.filter((block) => filter === "all" || (filter === "active" && block.status === "Active") || (filter === "progress" && block.status === "In progress") || (filter === "done" && block.status === "Done"));
}

export function reorderProjects(blocks: ProjectBlock[], projectId: string, targetId: string, position: "before" | "after" = "after") {
  if (projectId === targetId) return blocks;
  const moved = blocks.find((block) => block.id === projectId);
  if (!moved) return blocks;
  const reordered = blocks.filter((block) => block.id !== projectId);
  const targetIndex = reordered.findIndex((block) => block.id === targetId);
  if (targetIndex < 0) return blocks;
  reordered.splice(targetIndex + (position === "after" ? 1 : 0), 0, moved);
  return reordered;
}

const columnTypes = new Set<ProjectColumnType>(["text", "number", "date", "checkbox", "select"]);

export function normalizeProjectBlock(raw: unknown): ProjectBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<ProjectBlock>;
  if (typeof value.id !== "string" || typeof value.title !== "string") return null;
  const status: ProjectStatus = value.status === "In progress" || value.status === "Done" ? value.status : "Active";
  const table = value.table && typeof value.table === "object" && Array.isArray(value.table.columns) && Array.isArray(value.table.rows) ? {
    columns: value.table.columns.flatMap((column) => column && typeof column === "object" && typeof column.id === "string" && typeof column.name === "string" && columnTypes.has(column.type) ? [{ id: column.id, name: column.name, type: column.type, ...(column.type === "select" ? { options: Array.isArray(column.options) ? column.options.filter((option): option is string => typeof option === "string") : [] } : {}) }] : []),
    rows: value.table.rows.flatMap((row) => row && typeof row === "object" && typeof row.id === "string" && row.cells && typeof row.cells === "object" ? [{ id: row.id, cells: Object.fromEntries(Object.entries(row.cells).filter(([, cell]) => typeof cell === "string" || typeof cell === "boolean")) }] : []),
  } : undefined;
  const flowchart = value.flowchart && typeof value.flowchart === "object" && Array.isArray(value.flowchart.nodes) && Array.isArray(value.flowchart.edges) ? {
    nodes: value.flowchart.nodes.flatMap((node) => node && typeof node === "object" && typeof node.id === "string" && typeof node.label === "string" ? [{ id: node.id, label: node.label, x: Number.isFinite(node.x) ? Math.max(0, Number(node.x)) : 40, y: Number.isFinite(node.y) ? Math.max(0, Number(node.y)) : 40, width: Number.isFinite(node.width) ? Math.max(180, Math.min(520, Number(node.width))) : 304, height: Number.isFinite(node.height) ? Math.max(100, Math.min(320, Number(node.height))) : 112, color: typeof node.color === "string" ? node.color : "#38bdf8", ...(typeof node.pageText === "string" ? { pageText: node.pageText } : {}) }] : []),
    edges: value.flowchart.edges.flatMap((edge) => edge && typeof edge === "object" && typeof edge.id === "string" && typeof edge.source === "string" && typeof edge.target === "string" ? [{ id: edge.id, source: edge.source, target: edge.target, label: typeof edge.label === "string" ? edge.label : "" }] : []),
    zoom: Number.isFinite(value.flowchart.zoom) ? Math.max(0.5, Math.min(1.75, Number(value.flowchart.zoom))) : 1,
  } : undefined;
  const mindmap = value.mindmap && typeof value.mindmap === "object" && Array.isArray(value.mindmap.objects) ? {
    objects: value.mindmap.objects.flatMap((object, index) => object && typeof object === "object" && typeof object.id === "string" && typeof object.title === "string" ? [{ id: object.id, title: object.title, x: Number.isFinite(object.x) ? Math.max(0, Number(object.x)) : 60 + (index % 3) * 250, y: Number.isFinite(object.y) ? Math.max(0, Number(object.y)) : 60 + Math.floor(index / 3) * 180, width: Number.isFinite(object.width) ? Math.max(180, Math.min(520, Number(object.width))) : 304, height: Number.isFinite(object.height) ? Math.max(100, Math.min(320, Number(object.height))) : 112, color: typeof object.color === "string" ? object.color : "#38bdf8", ...(typeof object.pageText === "string" ? { pageText: object.pageText } : {}), ...(typeof object.parentId === "string" ? { parentId: object.parentId } : {}), relationIds: Array.isArray(object.relationIds) ? object.relationIds.filter((id): id is string => typeof id === "string") : [], fields: Array.isArray(object.fields) ? object.fields.flatMap((field) => field && typeof field === "object" && typeof field.id === "string" ? [{ id: field.id, key: typeof field.key === "string" ? field.key : "", value: typeof field.value === "string" ? field.value : "" }] : []) : [] }] : []),
  } : undefined;
  return { id: value.id, title: value.title, status, body: typeof value.body === "string" ? value.body : "", ...(typeof value.docHtml === "string" ? { docHtml: value.docHtml } : {}), ...(typeof value.docMarkdown === "string" ? { docMarkdown: value.docMarkdown } : {}), ...(table ? { table } : {}), ...(flowchart ? { flowchart } : {}), ...(mindmap ? { mindmap } : {}) };
}
