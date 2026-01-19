/**
 * Knowledge Page
 *
 * Displays extracted knowledge from Claude Code sessions.
 * Shows consolidated knowledge, CLAUDE.md preview, and session extractions.
 *
 * Data Flow:
 * 1. Fetches project list from /api/knowledge
 * 2. Fetches knowledge for selected project from /api/knowledge/[project]
 * 3. Displays knowledge in categorized sections
 *
 * Sections:
 * - Project selector
 * - Overview stats
 * - CLAUDE.md preview (markdown rendered)
 * - Episodic memories (incidents/resolutions)
 * - Semantic knowledge (facts)
 * - Procedural workflows
 * - Decisions
 * - Gotchas
 * - Raw extractions
 */

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { KnowledgeData, Task, Verification, Skill } from "@/types"

export default function KnowledgePage() {
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [knowledge, setKnowledge] = useState<KnowledgeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch project list on mount
  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/knowledge")
        if (res.ok) {
          const data = await res.json()
          setProjects(data.projects)
          if (data.projects.length > 0) {
            setSelectedProject(data.projects[0].id)
          }
        }
      } catch (err) {
        setError("Failed to load projects")
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  // Fetch knowledge when project changes
  useEffect(() => {
    if (!selectedProject) return

    async function fetchKnowledge() {
      setLoading(true)
      try {
        const res = await fetch(`/api/knowledge/${selectedProject}`)
        if (res.ok) {
          const data = await res.json()
          setKnowledge(data.data)
        } else {
          setError("Failed to load knowledge")
        }
      } catch (err) {
        setError("Failed to load knowledge")
      } finally {
        setLoading(false)
      }
    }
    fetchKnowledge()
  }, [selectedProject])

  if (loading && projects.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No extracted knowledge found. Run the CLI extraction commands first.
            </p>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Project selector */}
        <section className="mb-8">
          <div className="flex flex-wrap gap-2">
            {projects.map((project) => (
              <Button
                key={project.id}
                variant={selectedProject === project.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedProject(project.id)}
              >
                {project.name}
              </Button>
            ))}
          </div>
        </section>

        {loading ? (
          <p className="text-muted-foreground">Loading knowledge...</p>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-red-500">{error}</p>
          </Card>
        ) : knowledge ? (
          <div className="space-y-8">
            {/* Overview - use memory data if available, fallback to knowledge */}
            {(knowledge.memory || knowledge.knowledge) && (
              <OverviewSection
                knowledge={knowledge.memory || knowledge.knowledge!}
                tasksCount={knowledge.tasks.length}
                verificationType={knowledge.verification?.is_valid}
                skillsCount={knowledge.skills.length}
              />
            )}

            {/* Verification Results */}
            {knowledge.verification && (
              <VerificationSection verification={knowledge.verification} />
            )}

            {/* CLAUDE.md Preview */}
            {knowledge.claudeMd && (
              <ClaudeMdSection content={knowledge.claudeMd} />
            )}

            {/* Tasks */}
            {knowledge.tasks.length > 0 && (
              <TasksSection tasks={knowledge.tasks} />
            )}

            {/* Skills */}
            {knowledge.skills.length > 0 && (
              <SkillsSection skills={knowledge.skills} />
            )}

            {/* Memory section - use memory data for full content */}
            {knowledge.memory && (
              <>
                {/* Episodic Memories */}
                {knowledge.memory.episodic.length > 0 && (
                  <EpisodicSection memories={knowledge.memory.episodic} />
                )}

                {/* Semantic Knowledge */}
                {knowledge.memory.semantic.length > 0 && (
                  <SemanticSection knowledge={knowledge.memory.semantic} />
                )}

                {/* Procedural Workflows */}
                {knowledge.memory.procedural.length > 0 && (
                  <ProceduralSection workflows={knowledge.memory.procedural} />
                )}

                {/* Decisions */}
                {knowledge.memory.decisions.length > 0 && (
                  <DecisionsSection decisions={knowledge.memory.decisions} />
                )}

                {/* Gotchas */}
                {knowledge.memory.gotchas.length > 0 && (
                  <GotchasSection gotchas={knowledge.memory.gotchas} />
                )}
              </>
            )}

            {/* Raw Extractions */}
            {knowledge.extractions.length > 0 && (
              <ExtractionsSection extractions={knowledge.extractions} />
            )}
          </div>
        ) : null}
      </main>
    </div>
  )
}

function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Extracted Knowledge
              </h1>
              <p className="text-sm text-muted-foreground">
                Learnings from Claude Code sessions
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

function OverviewSection({
  knowledge,
  tasksCount,
  verificationType,
  skillsCount,
}: {
  knowledge: NonNullable<KnowledgeData["knowledge"]>
  tasksCount: number
  verificationType: boolean | undefined
  skillsCount: number
}) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Overview
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Sessions Analyzed</p>
          <p className="mt-1 text-2xl font-semibold">{knowledge.sessions_analyzed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Memory Items</p>
          <p className="mt-1 text-2xl font-semibold">
            {knowledge.episodic.length + knowledge.semantic.length + knowledge.procedural.length + knowledge.gotchas.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Tasks</p>
          <p className="mt-1 text-2xl font-semibold">{tasksCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Verification</p>
          <p className="mt-1 text-2xl font-semibold">
            {verificationType === undefined ? "N/A" : verificationType ? "Valid" : "Issues"}
          </p>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Episodic</p>
          <p className="text-lg font-semibold">{knowledge.episodic.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Semantic</p>
          <p className="text-lg font-semibold">{knowledge.semantic.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Procedural</p>
          <p className="text-lg font-semibold">{knowledge.procedural.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Decisions</p>
          <p className="text-lg font-semibold">{knowledge.decisions.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Gotchas</p>
          <p className="text-lg font-semibold">{knowledge.gotchas.length}</p>
        </Card>
      </div>
    </section>
  )
}

function ClaudeMdSection({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Generated CLAUDE.md
        </h2>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Collapse" : "Expand"}
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <pre
            className={`whitespace-pre-wrap font-mono text-sm text-foreground ${
              !expanded ? "max-h-64 overflow-hidden" : ""
            }`}
          >
            {content}
          </pre>
          {!expanded && (
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function EpisodicSection({ memories }: { memories: NonNullable<KnowledgeData["knowledge"]>["episodic"] }) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Episodic Memories
      </h2>
      <div className="space-y-3">
        {memories.map((memory, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{memory.incident}</p>
                  <p className="mt-1 text-sm text-green-400">
                    Resolution: {memory.resolution}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">{memory.occurrences}x</Badge>
                    <Badge variant="outline">{memory.last_seen}</Badge>
                    {memory.scope && <Badge variant="outline">{memory.scope}</Badge>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function SemanticSection({ knowledge }: { knowledge: NonNullable<KnowledgeData["knowledge"]>["semantic"] }) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Semantic Knowledge
      </h2>
      <div className="space-y-3">
        {knowledge.map((item, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground">{item.knowledge}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">{item.category}</Badge>
                    <Badge variant="outline">{item.confidence} confidence</Badge>
                    <Badge variant="outline">{item.frequency}x referenced</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function ProceduralSection({ workflows }: { workflows: NonNullable<KnowledgeData["knowledge"]>["procedural"] }) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Procedural Workflows
      </h2>
      <div className="space-y-3">
        {workflows.map((workflow, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{workflow.workflow}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="mb-3 text-sm text-muted-foreground">
                Trigger: {workflow.trigger}
              </p>
              <ol className="list-inside list-decimal space-y-1 text-sm">
                {workflow.steps.map((step, j) => (
                  <li key={j} className="text-foreground">
                    {step}
                  </li>
                ))}
              </ol>
              <Badge variant="outline" className="mt-3">
                Used {workflow.times_used}x
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function DecisionsSection({ decisions }: { decisions: NonNullable<KnowledgeData["knowledge"]>["decisions"] }) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Decisions
      </h2>
      <div className="space-y-3">
        {decisions.map((decision, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p className="font-medium text-foreground">{decision.decision}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Rationale: {decision.rationale}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant={decision.status === "active" ? "default" : "secondary"}>
                  {decision.status}
                </Badge>
                <Badge variant="outline">{decision.date}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function GotchasSection({ gotchas }: { gotchas: NonNullable<KnowledgeData["knowledge"]>["gotchas"] }) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Gotchas
      </h2>
      <div className="space-y-3">
        {gotchas.map((gotcha, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{gotcha.issue}</p>
                  <p className="mt-1 text-sm text-green-400">
                    Solution: {gotcha.solution}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {gotcha.tags.map((tag, j) => (
                      <Badge key={j} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                    <Badge variant="secondary">{gotcha.frequency}x</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function ExtractionsSection({ extractions }: { extractions: KnowledgeData["extractions"] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <section>
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Session Extractions
      </h2>
      <div className="space-y-3">
        {extractions.map((extraction) => (
          <Card key={extraction.session_id}>
            <CardContent className="p-4">
              <button
                className="w-full text-left"
                onClick={() =>
                  setExpanded(
                    expanded === extraction.session_id ? null : extraction.session_id
                  )
                }
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm text-muted-foreground">
                      {extraction.session_id.slice(0, 8)}...
                    </p>
                    <p className="mt-1 text-foreground">{extraction.session_summary}</p>
                  </div>
                  <Badge variant="outline">
                    {new Date(extraction.extracted_at).toLocaleDateString()}
                  </Badge>
                </div>
              </button>
              {expanded === extraction.session_id && (
                <div className="mt-4 border-t border-border pt-4">
                  <pre className="max-h-96 overflow-auto whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                    {JSON.stringify(extraction, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function TasksSection({ tasks }: { tasks: Task[] }) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Generated Tasks
      </h2>
      <div className="space-y-3">
        {tasks.map((task, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{task.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge
                    variant={
                      task.priority === "high"
                        ? "destructive"
                        : task.priority === "medium"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {task.priority}
                  </Badge>
                  <Badge variant="outline">{task.task_type}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{task.description}</p>
              <div className="mt-3 rounded-md bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">Suggested Approach:</p>
                <p className="mt-1 text-sm text-foreground">{task.suggested_approach}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {task.tags.map((tag, j) => (
                  <Badge key={j} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function VerificationSection({ verification }: { verification: Verification }) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Verification Results
        </h2>
        <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? "Hide Details" : "Show Details"}
        </Button>
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex size-12 items-center justify-center rounded-full ${
                verification.is_valid ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
              }`}
            >
              {verification.is_valid ? (
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-lg font-semibold">
                Score: {verification.score}/100
              </p>
              <p className="text-sm text-muted-foreground">
                {verification.issues.length} issues, {verification.items_tested.length} items tested
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-foreground">{verification.summary}</p>

          {showDetails && (
            <div className="mt-4 space-y-4 border-t border-border pt-4">
              {verification.issues.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Issues Found:</p>
                  <div className="space-y-2">
                    {verification.issues.map((issue, i) => (
                      <div key={i} className="rounded-md bg-muted/50 p-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              issue.severity === "error"
                                ? "destructive"
                                : issue.severity === "warning"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {issue.severity}
                          </Badge>
                          <Badge variant="outline">{issue.type}</Badge>
                        </div>
                        <p className="mt-2 text-sm">{issue.description}</p>
                        {issue.suggestion && (
                          <p className="mt-1 text-sm text-green-400">Suggestion: {issue.suggestion}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {verification.items_tested.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Items Tested:</p>
                  <div className="space-y-2">
                    {verification.items_tested.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-md bg-muted/50 p-2">
                        <div
                          className={`mt-0.5 size-4 shrink-0 rounded-full ${
                            item.still_valid ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <div>
                          <p className="text-sm">{item.item}</p>
                          <p className="text-xs text-muted-foreground">{item.test_method}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function SkillsSection({ skills }: { skills: Skill[] }) {
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null)

  return (
    <section>
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Generated Skills
      </h2>
      <div className="space-y-3">
        {skills.map((skill) => (
          <Card key={skill.name}>
            <CardContent className="p-4">
              <button
                className="w-full text-left"
                onClick={() =>
                  setExpandedSkill(expandedSkill === skill.name ? null : skill.name)
                }
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{skill.name}</p>
                  <Badge variant="outline">Skill</Badge>
                </div>
              </button>
              {expandedSkill === skill.name && (
                <div className="mt-4 border-t border-border pt-4">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-foreground">
                    {skill.content}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
