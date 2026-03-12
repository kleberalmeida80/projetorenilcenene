import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Search,
  Plus,
  Phone,
  Calendar,
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Download,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

import { Lideranca, Stats, Usuario, Perfil, Grupo, Agenda } from './types';
import { calculateAge, formatWhatsApp, GRUPOS, SITUACOES, COMPROMISSOS, PRIORIDADES } from './utils';

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, user }: { activeTab: string, setActiveTab: (t: string) => void, user: Usuario }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'liderancas', label: 'Lideranças', icon: Users },
    { id: 'agendas', label: 'Agendas', icon: Calendar },
    { id: 'cadastro', label: 'Novo Cadastro', icon: UserPlus, roles: ['Administrador', 'Coordenador Geral', 'Coordenador de Grupo', 'Operador'] },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
    { id: 'config', label: 'Configurações', icon: Settings, roles: ['Administrador'] },
  ];

  return (
    <div className="h-full bg-slate-900 text-white w-64 flex flex-col shadow-xl">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-emerald-400">Painel de Base</h1>
        <p className="text-xs text-slate-400 mt-1">Renilce e Nene</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.filter(item => !item.roles || item.roles.includes(user.perfil)).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.id 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center space-x-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold">
            {user.nome.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.nome}</p>
            <p className="text-xs text-slate-500 truncate">{user.perfil}</p>
          </div>
          <button className="text-slate-500 hover:text-red-400 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

const Dashboard = ({ stats }: { stats: Stats | null }) => {
  if (!stats) return <div className="p-8">Carregando indicadores...</div>;

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const groupData = [
    { name: 'Fora da Igreja', value: stats.foraIgreja },
    { name: 'Igreja / Pastores', value: stats.igreja },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Lideranças" value={stats.total} icon={Users} color="bg-blue-500" />
        <StatCard title="Votos Nene" value={stats.votosNene} icon={TrendingUp} color="bg-emerald-500" />
        <StatCard title="Votos Renilce" value={stats.votosRenilce} icon={TrendingUp} color="bg-indigo-500" />
        <StatCard title="Média Votos/Líd." value={(stats.total > 0 ? (stats.votosNene + stats.votosRenilce) / stats.total : 0).toFixed(1)} icon={FileText} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
            <TrendingUp size={20} className="text-emerald-500" />
            <span>Votos por Cidade (Top 5)</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.rankingCidades}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="cidade" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  cursor={{fill: '#f8fafc'}}
                />
                <Bar dataKey="total_votos" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
            <Users size={20} className="text-blue-500" />
            <span>Distribuição por Grupo</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={groupData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {groupData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const LiderancaList = ({ onEdit, user }: { onEdit: (l: Lideranca) => void, user: Usuario }) => {
  const [liderancas, setLiderancas] = useState<Lideranca[]>([]);
  const [search, setSearch] = useState('');
  const [filterGrupo, setFilterGrupo] = useState('');

  const fetchLiderancas = async () => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filterGrupo) params.append('grupo', filterGrupo);
    
    const res = await fetch(`/api/liderancas?${params.toString()}`);
    const data = await res.json();
    setLiderancas(data);
  };

  useEffect(() => {
    fetchLiderancas();
  }, [search, filterGrupo]);

  const canEdit = (l: Lideranca) => {
    if (user.perfil === 'Administrador' || user.perfil === 'Coordenador Geral') return true;
    if (user.perfil === 'Coordenador de Grupo' && user.grupo === l.grupo) return true;
    if (user.perfil === 'Operador') return true;
    return false;
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Base de Lideranças</h2>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            value={filterGrupo}
            onChange={(e) => setFilterGrupo(e.target.value)}
          >
            <option value="">Todos os Grupos</option>
            {GRUPOS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Liderança</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Grupo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Localização</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Votos (N/R)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Situação</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {liderancas.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <Users size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{l.nome_lideranca}</p>
                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                          <span>{formatWhatsApp(l.fone_zap)}</span>
                          {l.data_aniversario && (
                            <>
                              <span>•</span>
                              <span>{calculateAge(l.data_aniversario)} anos</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      l.grupo === 'Igreja / Pastores' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {l.grupo}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700">{l.cidade}</p>
                    <p className="text-xs text-slate-500">{l.bairro}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-emerald-600">{l.votos_nene}</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-sm font-bold text-indigo-600">{l.votos_renilce}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1.5">
                      <div className={`w-2 h-2 rounded-full ${
                        l.situacao === 'ativo' ? 'bg-emerald-500' : 
                        l.situacao === 'pendente' ? 'bg-amber-500' : 'bg-slate-400'
                      }`} />
                      <span className="text-xs font-medium capitalize text-slate-600">{l.situacao}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => window.open(`https://wa.me/55${l.fone_zap.replace(/\D/g, '')}`, '_blank')}
                        className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Phone size={18} />
                      </button>
                      {canEdit(l) && (
                        <button 
                          onClick={() => onEdit(l)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <ChevronRight size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const LiderancaForm = ({ lideranca, onSave, onCancel }: { lideranca?: Partial<Lideranca>, onSave: () => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState<Partial<Lideranca>>(lideranca || {
    grupo: 'Fora da Igreja',
    situacao: 'ativo',
    compromisso_politico: 'indefinido',
    prioridade: 'média',
    votos_nene: 0,
    votos_renilce: 0,
    percentual_votos_municipio: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = formData.id ? 'PUT' : 'POST';
    const url = formData.id ? `/api/liderancas/${formData.id}` : '/api/liderancas';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    onSave();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <h2 className="text-2xl font-bold mb-8">{formData.id ? 'Editar Liderança' : 'Novo Cadastro'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Grupo</label>
              <select
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.grupo}
                onChange={(e) => setFormData({...formData, grupo: e.target.value as Grupo})}
                required
              >
                {GRUPOS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Nome da Liderança</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.nome_lideranca || ''}
                onChange={(e) => setFormData({...formData, nome_lideranca: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">WhatsApp (apenas números)</label>
              <input
                type="text"
                placeholder="Ex: 91988776655"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.fone_zap || ''}
                onChange={(e) => setFormData({...formData, fone_zap: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Data Aniversário</label>
              <div className="flex items-center space-x-3">
                <input
                  type="date"
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.data_aniversario || ''}
                  onChange={(e) => setFormData({...formData, data_aniversario: e.target.value})}
                />
                {formData.data_aniversario && (
                  <div className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-bold text-slate-600">
                    {calculateAge(formData.data_aniversario)} anos
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Cidade</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.cidade || ''}
                onChange={(e) => setFormData({...formData, cidade: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Bairro</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.bairro || ''}
                onChange={(e) => setFormData({...formData, bairro: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Indicado por</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.indicacao || ''}
                onChange={(e) => setFormData({...formData, indicacao: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Acompanhado por</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.acompanhado_por || ''}
                onChange={(e) => setFormData({...formData, acompanhado_por: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Situação</label>
              <select
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.situacao}
                onChange={(e) => setFormData({...formData, situacao: e.target.value as any})}
              >
                {SITUACOES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Compromisso Político</label>
              <select
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.compromisso_politico}
                onChange={(e) => setFormData({...formData, compromisso_politico: e.target.value as any})}
              >
                {COMPROMISSOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Prioridade</label>
              <select
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.prioridade}
                onChange={(e) => setFormData({...formData, prioridade: e.target.value as any})}
              >
                {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Votos Projetados Nene</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.votos_nene || 0}
                onChange={(e) => setFormData({...formData, votos_nene: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Votos Projetados Renilce</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.votos_renilce || 0}
                onChange={(e) => setFormData({...formData, votos_renilce: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Percentual Votos Município (%)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.percentual_votos_municipio || 0}
                onChange={(e) => setFormData({...formData, percentual_votos_municipio: parseFloat(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Última Visita</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.ultima_visita || ''}
                onChange={(e) => setFormData({...formData, ultima_visita: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Demanda Recebida</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.demanda_recebida || ''}
              onChange={(e) => setFormData({...formData, demanda_recebida: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Observações Internas</label>
            <textarea
              className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 h-32"
              value={formData.observacoes || ''}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
            >
              Salvar Cadastro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Relatorios = () => {
  const [liderancas, setLiderancas] = useState<Lideranca[]>([]);

  useEffect(() => {
    fetch('/api/liderancas').then(r => r.json()).then(setLiderancas);
  }, []);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(liderancas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lideranças");
    XLSX.writeFile(wb, "relatorio_liderancas.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Lideranças - Renilce e Nene", 14, 15);
    (doc as any).autoTable({
      startY: 20,
      head: [['Nome', 'Grupo', 'Cidade', 'Votos Nene', 'Votos Renilce']],
      body: liderancas.map(l => [l.nome_lideranca, l.grupo, l.cidade, l.votos_nene, l.votos_renilce]),
    });
    doc.save("relatorio_liderancas.pdf");
  };

  const semVisita30Dias = liderancas.filter(l => {
    if (!l.ultima_visita) return true;
    try {
      const diff = differenceInDays(new Date(), parseISO(l.ultima_visita));
      return diff > 30;
    } catch (e) {
      return true;
    }
  });

  const rankingLiderancas = [...liderancas].sort((a, b) => 
    (b.votos_nene + b.votos_renilce) - (a.votos_nene + a.votos_renilce)
  ).slice(0, 10);

  const votosPorCidade = liderancas.reduce((acc: any, curr) => {
    const cidade = curr.cidade || 'Não Informada';
    if (!acc[cidade]) acc[cidade] = { nene: 0, renilce: 0, total: 0 };
    acc[cidade].nene += curr.votos_nene;
    acc[cidade].renilce += curr.votos_renilce;
    acc[cidade].total += (curr.votos_nene + curr.votos_renilce);
    return acc;
  }, {});

  const votosPorBairro = liderancas.reduce((acc: any, curr) => {
    const bairro = curr.bairro || 'Não Informado';
    if (!acc[bairro]) acc[bairro] = { nene: 0, renilce: 0, total: 0 };
    acc[bairro].nene += curr.votos_nene;
    acc[bairro].renilce += curr.votos_renilce;
    acc[bairro].total += (curr.votos_nene + curr.votos_renilce);
    return acc;
  }, {});

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Relatórios e Exportação</h2>
        <div className="flex space-x-3">
          <button 
            onClick={exportExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
          >
            <Download size={18} />
            <span>Exportar Excel</span>
          </button>
          <button 
            onClick={exportPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
          >
            <FileText size={18} />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Ranking de Lideranças */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold mb-8 flex items-center space-x-3">
          <TrendingUp size={24} className="text-amber-500" />
          <span>Ranking de Lideranças (Top 10)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {rankingLiderancas.map((l, index) => (
            <div key={l.id} className="relative p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
              <div className={`absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                index === 0 ? 'bg-amber-400' : 
                index === 1 ? 'bg-slate-400' : 
                index === 2 ? 'bg-amber-700' : 'bg-slate-300'
              }`}>
                {index + 1}º
              </div>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Users size={32} className="text-slate-400" />
              </div>
              <p className="font-bold text-slate-900 text-sm mb-1 line-clamp-1">{l.nome_lideranca}</p>
              <p className="text-xs text-slate-500 mb-3">{l.cidade}</p>
              <div className="w-full pt-3 border-t border-slate-200">
                <p className="text-lg font-black text-emerald-600">{l.votos_nene + l.votos_renilce}</p>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Votos Totais</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="font-bold mb-4">Consolidado por Grupo</h4>
          <div className="space-y-3">
            {GRUPOS.map(g => (
              <div key={g} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">{g}</span>
                <span className="font-bold">{liderancas.filter(l => l.grupo === g).length}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="font-bold mb-4">Consolidado por Situação</h4>
          <div className="space-y-3">
            {SITUACOES.map(s => (
              <div key={s} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium capitalize">{s}</span>
                <span className="font-bold">{liderancas.filter(l => l.situacao === s).length}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="font-bold mb-4">Projeção de Votos</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
              <span className="text-sm font-bold text-emerald-700">Nene</span>
              <span className="font-bold text-emerald-700">{liderancas.reduce((acc, curr) => acc + curr.votos_nene, 0)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
              <span className="text-sm font-bold text-indigo-700">Renilce</span>
              <span className="font-bold text-indigo-700">{liderancas.reduce((acc, curr) => acc + curr.votos_renilce, 0)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Votos por Cidade */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
            <MapPin size={20} className="text-emerald-500" />
            <span>Votos por Cidade</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Cidade</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Nene</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Renilce</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(votosPorCidade).sort((a: any, b: any) => b[1].total - a[1].total).map(([cidade, data]: any) => (
                  <tr key={cidade} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">{cidade}</td>
                    <td className="px-4 py-3 text-sm text-emerald-600 font-medium">{data.nene}</td>
                    <td className="px-4 py-3 text-sm text-indigo-600 font-medium">{data.renilce}</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-700">{data.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Votos por Bairro */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
            <MapPin size={20} className="text-blue-500" />
            <span>Votos por Bairro</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Bairro</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Nene</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Renilce</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(votosPorBairro).sort((a: any, b: any) => b[1].total - a[1].total).map(([bairro, data]: any) => (
                  <tr key={bairro} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">{bairro}</td>
                    <td className="px-4 py-3 text-sm text-emerald-600 font-medium">{data.nene}</td>
                    <td className="px-4 py-3 text-sm text-indigo-600 font-medium">{data.renilce}</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-700">{data.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Votos por Liderança */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
          <Users size={20} className="text-indigo-500" />
          <span>Votos por Liderança</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Liderança</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Grupo</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Nene</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Renilce</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {liderancas.sort((a, b) => (b.votos_nene + b.votos_renilce) - (a.votos_nene + a.votos_renilce)).map(l => (
                <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{l.nome_lideranca}</p>
                    <p className="text-xs text-slate-500">{l.cidade}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-slate-600">{l.grupo}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-emerald-600 font-medium">{l.votos_nene}</td>
                  <td className="px-4 py-3 text-sm text-indigo-600 font-medium">{l.votos_renilce}</td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-700">{l.votos_nene + l.votos_renilce}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lideranças por Grupo */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold mb-6 flex items-center space-x-2">
          <Users size={20} className="text-blue-500" />
          <span>Lideranças por Grupo</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Grupo</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Total Lideranças</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Votos Nene</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Votos Renilce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {GRUPOS.map(g => {
                const lids = liderancas.filter(l => l.grupo === g);
                const vNene = lids.reduce((acc, curr) => acc + curr.votos_nene, 0);
                const vRenilce = lids.reduce((acc, curr) => acc + curr.votos_renilce, 0);
                return (
                  <tr key={g} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">{g}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{lids.length}</td>
                    <td className="px-4 py-3 text-sm text-emerald-600 font-medium">{vNene}</td>
                    <td className="px-4 py-3 text-sm text-indigo-600 font-medium">{vRenilce}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center space-x-2">
            <AlertCircle size={20} className="text-amber-500" />
            <span>Lideranças sem Visita (+30 dias)</span>
          </h3>
          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
            {semVisita30Dias.length} Lideranças
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Liderança</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Cidade/Bairro</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Última Visita</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Dias Sem Visita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {semVisita30Dias.map(l => {
                const dias = l.ultima_visita ? differenceInDays(new Date(), parseISO(l.ultima_visita)) : 'Nunca';
                return (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{l.nome_lideranca}</p>
                      <p className="text-xs text-slate-500">{formatWhatsApp(l.fone_zap)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700">{l.cidade}</p>
                      <p className="text-xs text-slate-500">{l.bairro}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {l.ultima_visita ? format(parseISO(l.ultima_visita), 'dd/MM/yyyy') : 'Sem registro'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold">
                        {dias} dias
                      </span>
                    </td>
                  </tr>
                );
              })}
              {semVisita30Dias.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">
                    Todas as lideranças foram visitadas recentemente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Agendas = () => {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Agenda>>({
    titulo: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    hora: '',
    cidade: '',
    local: '',
    descricao: '',
    aviso: false,
    status: 'pendente'
  });

  const fetchAgendas = async () => {
    const res = await fetch('/api/agendas');
    const data = await res.json();
    setAgendas(data);
  };

  useEffect(() => {
    fetchAgendas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = formData.id ? 'PUT' : 'POST';
    const url = formData.id ? `/api/agendas/${formData.id}` : '/api/agendas';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    setShowForm(false);
    setFormData({
      titulo: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      hora: '',
      cidade: '',
      local: '',
      descricao: '',
      aviso: false,
      status: 'pendente'
    });
    fetchAgendas();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente excluir esta agenda?')) {
      await fetch(`/api/agendas/${id}`, { method: 'DELETE' });
      fetchAgendas();
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Agendas e Eventos</h2>
          <p className="text-slate-500">Gerencie compromissos em cidades e locais específicos</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 font-bold"
        >
          <Plus size={20} />
          <span>Nova Agenda</span>
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">{formData.id ? 'Editar Agenda' : 'Cadastrar Nova Agenda'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Título do Evento</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Data</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.data}
                  onChange={(e) => setFormData({...formData, data: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Hora</label>
                <input
                  type="time"
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.hora}
                  onChange={(e) => setFormData({...formData, hora: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Cidade</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.cidade}
                  onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Local Específico</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.local}
                  onChange={(e) => setFormData({...formData, local: e.target.value})}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Descrição / Detalhes</label>
                <textarea
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className={`w-12 h-6 rounded-full transition-colors relative ${formData.aviso ? 'bg-amber-500' : 'bg-slate-200'}`}>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={formData.aviso}
                      onChange={(e) => setFormData({...formData, aviso: e.target.checked})}
                    />
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.aviso ? 'left-7' : 'left-1'}`} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Ativar Aviso/Alerta</span>
                </label>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-bold text-slate-700">Status</label>
                  <select
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end space-x-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-8 py-3 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  {formData.id ? 'Salvar Alterações' : 'Criar Agenda'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6">
        {agendas.map((agenda) => (
          <div 
            key={agenda.id} 
            className={`bg-white p-6 rounded-3xl shadow-sm border-l-8 transition-all hover:shadow-md ${
              agenda.aviso ? 'border-l-amber-500' : 'border-l-emerald-500'
            } border-y border-r border-slate-100`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-3">
                  <h4 className="text-xl font-bold text-slate-900">{agenda.titulo}</h4>
                  {agenda.aviso && (
                    <span className="flex items-center space-x-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      <AlertCircle size={12} />
                      <span>Aviso Ativo</span>
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    agenda.status === 'confirmado' ? 'bg-emerald-100 text-emerald-700' :
                    agenda.status === 'cancelado' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {agenda.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-500">
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-emerald-500" />
                    <span>{format(parseISO(agenda.data), "dd 'de' MMMM", { locale: ptBR })}</span>
                    {agenda.hora && <span className="font-bold text-slate-900 ml-1">às {agenda.hora}</span>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-emerald-500" />
                    <span className="font-bold text-slate-700">{agenda.cidade}</span>
                    {agenda.local && <span className="text-slate-400">- {agenda.local}</span>}
                  </div>
                </div>
                {agenda.descricao && (
                  <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl italic">
                    "{agenda.descricao}"
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => {
                    setFormData(agenda);
                    setShowForm(true);
                  }}
                  className="p-3 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-2xl transition-all"
                >
                  <Settings size={20} />
                </button>
                <button 
                  onClick={() => handleDelete(agenda.id)}
                  className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {agendas.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Nenhuma agenda programada.</p>
            <button 
              onClick={() => setShowForm(true)}
              className="mt-4 text-emerald-500 font-bold hover:underline"
            >
              Criar primeiro compromisso
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user] = useState<Usuario>({
    id: 1,
    nome: 'Administrador',
    email: 'admin@campanha.com',
    perfil: 'Administrador'
  });
  const [stats, setStats] = useState<Stats | null>(null);
  const [editingLideranca, setEditingLideranca] = useState<Lideranca | undefined>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchStats = async () => {
    const res = await fetch('/api/stats');
    const data = await res.json();
    setStats(data);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSave = () => {
    fetchStats();
    setActiveTab('liderancas');
    setEditingLideranca(undefined);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} />;
      case 'liderancas':
        return <LiderancaList user={user} onEdit={(l) => {
          setEditingLideranca(l);
          setActiveTab('cadastro');
        }} />;
      case 'cadastro':
        return <LiderancaForm 
          lideranca={editingLideranca} 
          onSave={handleSave} 
          onCancel={() => {
            setActiveTab('liderancas');
            setEditingLideranca(undefined);
          }} 
        />;
      case 'relatorios':
        return <Relatorios />;
      case 'agendas':
        return <Agendas />;
      default:
        return <Dashboard stats={stats} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Desktop */}
      <div className="hidden lg:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white p-4 z-50 flex items-center justify-between">
        <h1 className="text-lg font-bold text-emerald-400">Painel de Base</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative w-64 h-full">
              <Sidebar 
                activeTab={activeTab} 
                setActiveTab={(t) => {
                  setActiveTab(t);
                  setIsMobileMenuOpen(false);
                }} 
                user={user} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </main>
    </div>
  );
}
