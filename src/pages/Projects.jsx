import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, PlusCircle, Trash2, Globe, Lock, Clock, Save, X,
  Play, Eye, Share2, FolderOpen, Terminal, ChevronRight, Sparkles, Edit3, Download
} from 'lucide-react';
import JSZip from 'jszip';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { apiCall } from '../utils/api';

import MonacoEditor from '../components/MonacoEditor';
import Skeleton from '../components/Skeleton';

const S = {
  card: { background: 'var(--overlay-bg)', border: '1px solid var(--overlay-bg)', borderRadius: '14px' },
  input: { width: '100%', padding: '10px 14px', background: 'var(--overlay-bg)', border: '1px solid var(--overlay-bg)', borderRadius: '9px', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' },
  btnPrimary: { background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: '9px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', fontSize: '0.87rem', fontWeight: 700 },
  btn: { background: 'var(--overlay-bg)', border: '1px solid var(--overlay-bg)', borderRadius: '9px', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.83rem', fontWeight: 600 },
};

const Projects = () => {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();

  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showNew, setShowNew]         = useState(false);

  /* New project form */
  const [newTitle, setNewTitle]       = useState('');
  const [newDesc, setNewDesc]         = useState('');
  const [newPublic, setNewPublic]     = useState(false);
  const [creating, setCreating]       = useState(false);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    setLoading(true);
    try { setProjects(await apiCall('/projects')); }
    catch { /* noop */ }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const defaultFile = { id: Date.now().toString(), name: 'main.py', language: 'python', content: '# Welcome to your new project\nprint("Hello World!")' };
      const p = await apiCall('/projects', { 
        method: 'POST', 
        body: JSON.stringify({ 
          title: newTitle, 
          description: newDesc, 
          language: 'mixed', 
          code: JSON.stringify([defaultFile]), 
          type: 'ide', 
          is_public: newPublic 
        }) 
      });
      setProjects(prev => [p, ...prev]);
      setShowNew(false);
      setNewTitle(''); setNewDesc(''); setNewPublic(false);
      navigate(`/ide?project=${p.id}`);
    } catch (e) { alert(e.message); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить проект?')) return;
    try {
      await apiCall(`/projects/${id}`, { method: 'DELETE' });
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (e) { alert(e.message); }
  };

  const handleDownload = async (project, e) => {
    e.stopPropagation();
    try {
      const zip = new JSZip();
      let files = [];
      try {
        files = typeof project.code === 'string' ? JSON.parse(project.code) : project.code;
      } catch {
        files = [{ name: 'main.txt', content: project.code || '' }];
      }
      
      files.forEach(f => {
        zip.file(f.name || 'file.txt', f.content || '');
      });
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title || 'project'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Ошибка при скачивании: " + err.message);
    }
  };



  /* ── PROJECTS LIST VIEW ── */
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
      
      <style>{`
        .pr-card:hover { border-color: var(--border-accent) !important; box-shadow: 0 4px 15px var(--brand-glow); }
      `}</style>

      <main className="animate-in" style={{ flex: 1, padding: '36px 40px', color: 'var(--text-primary)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '5px' }}>
              Мои проекты
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Свободное программирование — без курсов и ограничений</p>
          </div>
          <button style={S.btnPrimary} onClick={() => setShowNew(s => !s)}>
            <PlusCircle size={16} /> {showNew ? 'Свернуть' : 'Новый проект'}
          </button>
        </div>

        {/* Create form */}
        <AnimatePresence>
          {showNew && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ ...S.card, padding: '26px', marginBottom: '28px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px' }}>Создать новый проект</h3>
              <form onSubmit={handleCreate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>Название *</label>
                    <input required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Мой первый проект" style={S.input} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>Описание</label>
                    <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Что делает этот проект?" style={S.input} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" style={S.btn} onClick={() => setShowNew(false)}>Отмена</button>
                    <button type="submit" style={S.btnPrimary} disabled={creating}>{creating ? 'Создание...' : <><FolderOpen size={14} /> Создать</>}</button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter tabs - removed language filtering since projects are folders now */}

        {/* Projects grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {[...Array(6)].map((_, i) => <Skeleton key={i} height="160px" borderRadius="14px" />)}
          </div>
        ) : projects.length === 0 ? (
          <div style={{ ...S.card, padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FolderOpen size={52} style={{ opacity: 0.1, marginBottom: '16px' }} />
            <p style={{ fontSize: '1.05rem', marginBottom: '8px', fontWeight: 700 }}>Проектов нет</p>
            <p style={{ fontSize: '0.85rem', marginBottom: '20px' }}>Создай первый проект — пиши код без ограничений</p>
            <button style={{ ...S.btnPrimary, margin: '0 auto' }} onClick={() => setShowNew(true)}>
              <PlusCircle size={15} /> Создать проект
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {projects.map(project => {
              const updAt = new Date(project.updated_at);
              const ago = getTimeAgo(updAt);
              return (
                <motion.div key={project.id} className="pr-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ ...S.card, padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onClick={() => navigate(`/ide?project=${project.id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontSize: '1.5rem' }}>📁</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '2px' }}>{project.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Workspace</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={e => handleDownload(project, e)} style={{ background: 'var(--overlay-bg)', border: '1px solid var(--overlay-bg)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', padding: '6px', display: 'flex' }} title="Скачать ZIP">
                        <Download size={13} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(project.id); }} style={{ background: 'rgba(234, 67, 53, 0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', color: 'var(--danger)', cursor: 'pointer', padding: '6px', display: 'flex' }} title="Удалить">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {project.description && (
                    <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {project.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--overlay-bg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <Clock size={11} /> {ago}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--brand-primary)', fontWeight: 700 }}>
                      Открыть <ChevronRight size={13} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

function getTimeAgo(date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.round(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.round(diff / 3600)} ч назад`;
  return `${Math.round(diff / 86400)} дн назад`;
}

export default Projects;
