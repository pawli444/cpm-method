import React, { useState, useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import CytoscapeComponent from 'react-cytoscapejs';
import { calculateCPM, type Task, type TaskResult } from './cpm';
import api from './api';
import './App.css';

cytoscape.use(dagre);

function App() {
    // Stan autoryzacji i historii projektów
    const [token, setToken] = useState<string | null>(localStorage.getItem('cpm_token'));
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [savedProjects, setSavedProjects] = useState<any[]>([]);

    // Stan aplikacji CPM
    const [tasks, setTasks] = useState<Task[]>([]);
    const [results, setResults] = useState<TaskResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Formularz wprowadzania
    const [id, setId] = useState('');
    const [duration, setDuration] = useState<number | ''>('');
    const [deps, setDeps] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Przeliczanie CPM
    useEffect(() => {
        if (tasks.length > 0) {
            try {
                setError(null);
                setResults(calculateCPM(tasks));
            } catch (err: any) {
                setError(err.message);
                setResults([]);
            }
        } else {
            setResults([]);
        }
    }, [tasks]);

    // --- LOGOWANIE I REJESTRACJA ---
    const handleAuth = async (type: 'login' | 'register') => {
        try {
            setError(null);
            const res = await api.post(`/auth/${type}`, { email, password });
            if (type === 'login') {
                localStorage.setItem('cpm_token', res.data.token);
                setToken(res.data.token);
                setSuccess('Zalogowano pomyślnie!');
            } else {
                setSuccess('Konto utworzone! Możesz się teraz zalogować.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Błąd autoryzacji');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('cpm_token');
        setToken(null);
        setSavedProjects([]);
        setSuccess('Wylogowano.');
    };

    // --- BAZA DANYCH (Zapis/Odczyt/Usuwanie) ---
    const fetchProjects = async () => {
        if (!token) return;
        try {
            const res = await api.get('/projects');
            setSavedProjects(res.data);
        } catch (err) {
            console.error('Błąd pobierania projektów');
        }
    };

    // Pobierz projekty od razu po zalogowaniu
    useEffect(() => {
        if (token) fetchProjects();
    }, [token]);

    const saveToDatabase = async () => {
        if (!token) return setError('Musisz być zalogowany, aby zapisać projekt.');
        try {
            await api.post('/projects', { title: `Harmonogram - ${new Date().toLocaleString()}`, tasks: tasks });
            setSuccess('Projekt został zapisany w bazie danych!');
            fetchProjects(); // Odśwież listę po zapisie
        } catch (err) {
            setError('Błąd podczas zapisywania projektu.');
        }
    };

    const deleteProject = async (projectId: string) => {
        try {
            await api.delete(`/projects/${projectId}`);
            setSuccess('Projekt został usunięty z bazy.');
            fetchProjects(); // Odśwież listę po usunięciu
        } catch (err) {
            setError('Błąd podczas usuwania projektu.');
        }
    };

    const loadProject = (projectTasks: Task[]) => {
        setTasks(projectTasks);
        setSuccess('Projekt wczytany pomyślnie!');
    };

    // --- CSV IMPORT / EKSPORT ---
    const handleExportCSV = () => {
        let csvContent = "ID,Czas,Poprzedniki,ES,EF,LS,LF,Rezerwa,Krytyczna\n";
        results.forEach(r => {
            const depStr = r.dependencies.join(';');
            csvContent += `${r.id},${r.duration},${depStr},${r.es},${r.ef},${r.ls},${r.lf},${r.reserve},${r.isCritical}\n`;
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "projekt_cpm.csv";
        link.click();
    };

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim() !== '');
            const importedTasks: Task[] = [];

            lines.forEach((line, index) => {
                if (index === 0 && line.toLowerCase().includes('id')) return;
                const [taskId, time, depsStr] = line.split(',');
                if (taskId && time) {
                    const dependencies = depsStr ? depsStr.split(';').map(d => d.trim()).filter(d => d) : [];
                    importedTasks.push({ id: taskId.trim().toUpperCase(), duration: Number(time), dependencies });
                }
            });
            setTasks(importedTasks);
            setSuccess('Pomyślnie zaimportowano plik CSV!');
        };
        reader.readAsText(file);
    };

    // --- WPROWADZANIE DANYCH ---
    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || duration === '') return;
        const newDependencies = deps.split(',').map(d => d.trim()).filter(d => d !== '');
        const newTask: Task = { id: id.trim().toUpperCase(), duration: Number(duration), dependencies: newDependencies };
        setTasks([...tasks, newTask]);
        setId(''); setDuration(''); setDeps('');
    };

    // --- GENEROWANIE GRAFU ---
    const cyElements = results.flatMap(r => {
        const nodes = [{
            data: { id: r.id, label: `${r.id} (t=${r.duration})\nES: ${r.es} | EF: ${r.ef}\nLS: ${r.ls} | LF: ${r.lf}` },
            classes: r.isCritical ? 'critical' : ''
        }];
        const edges = r.dependencies.map(dep => ({
            data: { source: dep, target: r.id },
            classes: (results.find(res => res.id === dep)?.isCritical && r.isCritical) ? 'critical-edge' : ''
        }));
        return [...nodes, ...edges];
    });

    const maxProjectTime = results.length > 0 ? Math.max(...results.map(r => r.lf)) : 0;

    return (
        <div className="app-container">
            <header className="header">
                <h1>Kompleksowy System CPM</h1>
                <p>Wizualizacja, analiza sieciowa, eksport i baza danych</p>
            </header>

            {error && <div className="error-msg" onClick={() => setError(null)}>⚠️ {error}</div>}
            {success && <div className="error-msg" style={{backgroundColor: '#d1fae5', color: '#065f46'}} onClick={() => setSuccess(null)}>✅ {success}</div>}

            {/* AUTORYZACJA I ZARZĄDZANIE PROJEKTAMI */}
            <div className="card">
                <h2>Panel Użytkownika (Chmura Mongo)</h2>
                {!token ? (
                    <div className="form-group">
                        <div className="input-wrapper"><input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                        <div className="input-wrapper"><input type="password" placeholder="Hasło" value={password} onChange={e => setPassword(e.target.value)} /></div>
                        <button onClick={() => handleAuth('login')} className="btn btn-primary">Zaloguj</button>
                        <button onClick={() => handleAuth('register')} className="btn" style={{backgroundColor: '#6b7280', color: 'white'}}>Zarejestruj</button>
                    </div>
                ) : (
                    <div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                            <span style={{fontWeight: 'bold', color: '#059669'}}>✅ Zalogowano pomyślnie.</span>
                            <div>
                                {results.length > 0 && <button onClick={saveToDatabase} className="btn btn-success" style={{marginRight: '10px'}}>Zapisz obecny projekt w bazie</button>}
                                <button onClick={handleLogout} className="btn btn-danger">Wyloguj</button>
                            </div>
                        </div>

                        {/* LISTA ZAPISANYCH PROJEKTÓW W BAZIE */}
                        <div style={{borderTop: '1px solid #e5e7eb', paddingTop: '15px'}}>
                            <h3 style={{fontSize: '1rem', marginBottom: '10px', color: '#374151'}}>Twoje zapisane projekty w bazie danych:</h3>
                            {savedProjects.length === 0 ? (
                                <p style={{color: '#6b7280', fontSize: '0.9rem'}}>Brak zapisanych projektów. Stwórz wykres i zapisz go w chmurze!</p>
                            ) : (
                                <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                                    {savedProjects.map((proj) => (
                                        <li key={proj._id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f3f4f6', padding: '10px 15px', borderRadius: '6px', marginBottom: '8px'}}>
                                            <span style={{fontWeight: '500', color: '#1f2937'}}>{proj.title} <span style={{fontSize: '0.8rem', color: '#6b7280', marginLeft: '10px'}}>(Zadań: {proj.tasks.length})</span></span>
                                            <div>
                                                <button onClick={() => loadProject(proj.tasks)} className="btn btn-primary" style={{padding: '5px 12px', fontSize: '0.8rem', marginRight: '8px'}}>Wczytaj środowisko</button>
                                                <button onClick={() => deleteProject(proj._id)} className="btn btn-danger" style={{padding: '5px 12px', fontSize: '0.8rem'}}>Usuń</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="card">
                <h2>1. Wprowadzanie Danych (Opcje)</h2>

                {/* Ręczne wprowadzanie */}
                <form onSubmit={handleAddTask} className="form-group" style={{marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee'}}>
                    <div className="input-wrapper">
                        <label>ID czynności</label>
                        <input type="text" value={id} onChange={e => setId(e.target.value)} />
                    </div>
                    <div className="input-wrapper">
                        <label>Czas trwania</label>
                        <input type="number" min="0" value={duration} onChange={e => setDuration(e.target.value === '' ? '' : Number(e.target.value))} />
                    </div>
                    <div className="input-wrapper">
                        <label>Poprzedniki (przecinek)</label>
                        <input type="text" placeholder="np. A, B" value={deps} onChange={e => setDeps(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary">Dodaj ręcznie</button>
                </form>

                {/* CSV Import/Export */}
                <div className="form-group">
                    <input type="file" accept=".csv" ref={fileInputRef} style={{display: 'none'}} onChange={handleImportCSV} />
                    <button onClick={() => fileInputRef.current?.click()} className="btn" style={{backgroundColor: '#8b5cf6', color: 'white'}}>Wgraj z CSV</button>
                    {results.length > 0 && <button onClick={handleExportCSV} className="btn" style={{backgroundColor: '#f59e0b', color: 'white'}}>Pobierz jako CSV</button>}
                    <button onClick={() => setTasks([])} className="btn btn-danger">Wyczyść środowisko</button>
                </div>
            </div>

            {results.length > 0 && (
                <>
                    <div className="card">
                        <h2>2. Wyniki Analizy CPM</h2>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                <tr><th>ID</th><th>Czas (t)</th><th>ES</th><th>EF</th><th>LS</th><th>LF</th><th>Rezerwa</th><th>Krytyczna</th></tr>
                                </thead>
                                <tbody>
                                {results.map(r => (
                                    <tr key={r.id} className={r.isCritical ? 'critical-row' : ''}>
                                        <td><strong>{r.id}</strong></td><td>{r.duration}</td><td>{r.es}</td><td>{r.ef}</td>
                                        <td>{r.ls}</td><td>{r.lf}</td><td>{r.reserve}</td>
                                        <td><span className={`badge ${r.isCritical ? 'badge-critical' : 'badge-normal'}`}>{r.isCritical ? 'TAK' : 'NIE'}</span></td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card">
                        <h2>3. Harmonogram Gantta (ASAP / ALAP)</h2>
                        <div style={{ position: 'relative', width: '100%', border: '1px solid #ddd', padding: '10px', background: '#fafafa', borderRadius: '4px' }}>
                            <div style={{ display: 'flex', borderBottom: '2px solid #ccc', marginBottom: '10px', paddingBottom: '5px' }}>
                                <div style={{ width: '50px', fontWeight: 'bold' }}>ID</div>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 0 }}>0</span>
                                    <span style={{ position: 'absolute', right: 0 }}>{maxProjectTime} (Koniec)</span>
                                </div>
                            </div>
                            {results.map(r => (
                                <div key={r.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                                    <div style={{ width: '50px', fontWeight: 'bold' }}>{r.id}</div>
                                    <div style={{ flex: 1, position: 'relative', height: '30px', background: '#eee', borderRadius: '4px' }}>
                                        <div style={{ position: 'absolute', left: `${(r.es / maxProjectTime) * 100}%`, width: `${((r.lf - r.es) / maxProjectTime) * 100}%`, height: '100%', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '4px' }}></div>
                                        <div style={{ position: 'absolute', left: `${(r.es / maxProjectTime) * 100}%`, width: `${(r.duration / maxProjectTime) * 100}%`, height: '100%', background: r.isCritical ? '#ef4444' : '#3b82f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px' }}>t={r.duration}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <h2>4. Graf Sieciowy</h2>
                        <div className="graph-container">
                            <CytoscapeComponent
                                elements={cyElements}
                                style={{ width: '100%', height: '100%' }}
                                layout={{ name: 'dagre', rankDir: 'LR', nodeSep: 60, rankSep: 100 }}
                                stylesheet={[
                                    { selector: 'node', style: { 'shape': 'round-rectangle', 'label': 'data(label)', 'text-wrap': 'wrap', 'text-valign': 'center', 'text-halign': 'center', 'background-color': '#ffffff', 'border-width': 2, 'border-color': '#3b82f6', 'color': '#1f2937', 'width': 130, 'height': 65, 'font-size': '12px', 'font-family': 'monospace' } },
                                    { selector: 'edge', style: { 'width': 2, 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'line-color': '#9ca3af', 'target-arrow-color': '#9ca3af' } },
                                    { selector: '.critical', style: { 'background-color': '#fef2f2', 'border-color': '#dc2626', 'border-width': 3, 'color': '#991b1b' } },
                                    { selector: '.critical-edge', style: { 'line-color': '#dc2626', 'target-arrow-color': '#dc2626', 'width': 4 } }
                                ]}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default App;