import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Route, Switch } from 'wouter'
import './App.css'
import './forms.css'

type IncidentCase = { id: number; title: string; owner: string; status: 'Draft' | 'Review' | 'Resolved'; priority: 'Low' | 'Medium' | 'High' }
const api = '/api/items'

async function readEvidence(): Promise<IncidentCase[]> {
  const response = await fetch(api)
  if (!response.ok) throw new Error('The refrigeration incident service is unavailable.')
  return response.json()
}

async function createEvidence(item: Omit<IncidentCase, 'id'>): Promise<IncidentCase> {
  const response = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) })
  if (!response.ok) throw new Error('The incident case could not be saved.')
  return response.json()
}

async function advanceEvidence(item: IncidentCase): Promise<IncidentCase> {
  const status = item.status === 'Draft' ? 'Review' : 'Resolved'
  const response = await fetch(`${api}/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...item, status }) })
  if (!response.ok) throw new Error('The incident case could not be updated.')
  return response.json()
}

function Register() {
  const cache = useQueryClient()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { data = [], isPending, error } = useQuery({ queryKey: ['evidence'], queryFn: readEvidence })
  const save = useMutation({ mutationFn: createEvidence, onSuccess: () => { cache.invalidateQueries({ queryKey: ['evidence'] }); setOpen(false) } })
  const advance = useMutation({ mutationFn: advanceEvidence, onSuccess: () => cache.invalidateQueries({ queryKey: ['evidence'] }) })
  const visible = data.filter((item) => `${item.title} ${item.owner} ${item.status}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.title.localeCompare(b.title))
  const approved = data.filter((item) => item.status === 'Resolved').length
  const high = data.filter((item) => item.priority === 'High').length

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    save.mutate({ title: String(values.get('title')), owner: String(values.get('owner')), status: 'Draft', priority: String(values.get('priority')) as IncidentCase['priority'] })
  }

  return <main>
    <header className="hero"><div><span className="eyebrow">Coordinate urgent response to connected refrigeration cyber incidents</span><h1>Refrigeration Cyber Incident Office</h1><p>Connect retailers, cold-chain operators, manufacturers and response teams around exposure, containment and recovery.</p></div><button className="primary" onClick={() => setOpen(!open)}>{open ? 'Close form' : 'Add incident case'}</button></header>
    <section className="metrics" aria-label="refrigeration cyber incident summary"><article><span>Cases tracked</span><strong>{isPending ? '…' : data.length}</strong><small>Shared incident view</small></article><article><span>Resolved</span><strong>{approved}</strong><small>Recovery confirmed</small></article><article><span>High priority</span><strong>{high}</strong><small>Needs coordinated action</small></article></section>
    {open && <form className="panel form" onSubmit={submit}><h2>Add an incident case</h2><label>Affected refrigeration system or response need<input required name="title" minLength={4} placeholder="Example: supermarket controller isolation" /></label><label>Responsible operator or response team<input required name="owner" minLength={3} placeholder="Example: National Retail CSIRT" /></label><label>Priority<select name="priority"><option>High</option><option>Medium</option><option>Low</option></select></label><button className="primary" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save incident case'}</button>{save.error && <p role="alert">{save.error.message}</p>}</form>}
    <section className="panel"><div className="panel-title"><h2>Coordinated incident pipeline</h2><span>{error ? 'Connection problem' : 'Live API data'}</span></div><label className="search">Find an incident case<input aria-label="Find an incident case" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by system, operator, response team or status" /></label>{error && <p role="alert">{error.message}</p>}{!isPending && !error && visible.length === 0 && <p>No incident cases match this view.</p>}{visible.map((item) => <div className="row" key={item.id}><span className={`dot ${item.status === 'Resolved' ? '' : 'degraded'}`} /><div><b>{item.title}</b><small>{item.owner} · {item.status}</small></div><strong>{item.priority}</strong>{item.status !== 'Resolved' && <button className="secondary" disabled={advance.isPending} onClick={() => advance.mutate(item)}>Move to {item.status === 'Draft' ? 'review' : 'resolved'}</button>}</div>)}</section>
  </main>
}

function About() { return <main><header className="hero"><div><span className="eyebrow">Why it matters</span><h1>Cold-chain continuity depends on fast, coordinated cyber response</h1></div></header><section className="panel prose"><h2>A clear path from exposure to verified recovery</h2><p>Operators can see who owns each incident, which system is affected and what evidence remains before resolution.</p></section></main> }

export default function App() { return <div className="shell"><nav><b>ColdChainCERT<span>/incident coordination</span></b><div><Link href="/">Incident cases</Link><Link href="/about">Purpose</Link></div></nav><Switch><Route path="/" component={Register} /><Route path="/about" component={About} /></Switch></div> }
