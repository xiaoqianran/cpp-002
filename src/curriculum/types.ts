/** 课程数据结构 */

export type LessonAction = {
  label: string;
  /** 一键把实验台调到本课推荐状态 */
  sceneId?: 0 | 1 | 2 | 3 | 4;
  debugMode?: 0 | 1 | 2 | 3;
  useNee?: boolean;
  useMis?: boolean;
  useBvh?: boolean;
  useRr?: boolean;
  maxDepth?: number;
};

export type LessonBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "formula"; title?: string; latex: string }
  | { type: "code"; title?: string; lang?: string; code: string }
  | { type: "mermaid"; title?: string; code: string }
  | { type: "callout"; tone: "info" | "warn" | "tip"; text: string }
  | { type: "map"; rows: { file: string; note: string }[] }
  | { type: "compare"; left: { title: string; body: string }; right: { title: string; body: string } }
  | { type: "quiz"; q: string; options: string[]; answer: number; explain: string };

export type Lesson = {
  id: string;
  title: string;
  minutes: number;
  summary: string;
  refs: string[]; // GAMES101 / Shirley / PBRT
  blocks: LessonBlock[];
  action?: LessonAction;
};

export type Chapter = {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  lessons: Lesson[];
};
