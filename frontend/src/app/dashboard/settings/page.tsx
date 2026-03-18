'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  FileCheck, ClipboardList, Plus, Trash2, Save, RotateCcw, Loader2,
  GripVertical, Info, ChevronDown, ChevronUp, Code
} from 'lucide-react';
import {
  type TemplateItem,
  SHORTCODES,
  DEFAULT_EKINERJA_TEMPLATES,
  DEFAULT_EREMUNERASI_TEMPLATES,
  EKINERJA_CATEGORIES,
  EREMUNERASI_CATEGORIES,
} from '@/lib/report-templates';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ekinerjaTemplates, setEkinerjaTemplates] = useState<TemplateItem[]>([]);
  const [eremunerasiTemplates, setEremunerasiTemplates] = useState<TemplateItem[]>([]);
  const [showLegend, setShowLegend] = useState(false);
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/report-templates');
      if (res.ok) {
        const data = await res.json();
        setEkinerjaTemplates(
          data.ekinerja_templates?.length ? data.ekinerja_templates : DEFAULT_EKINERJA_TEMPLATES
        );
        setEremunerasiTemplates(
          data.eremunerasi_templates?.length ? data.eremunerasi_templates : DEFAULT_EREMUNERASI_TEMPLATES
        );
        setIsCustom(data.is_custom);
      }
    } catch {
      setEkinerjaTemplates([...DEFAULT_EKINERJA_TEMPLATES]);
      setEremunerasiTemplates([...DEFAULT_EREMUNERASI_TEMPLATES]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/report-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ekinerja_templates: ekinerjaTemplates,
          eremunerasi_templates: eremunerasiTemplates,
        }),
      });
      if (res.ok) {
        setIsCustom(true);
        toast.success('Template berhasil disimpan');
      } else {
        toast.error('Gagal menyimpan template');
      }
    } catch {
      toast.error('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Kembalikan semua template ke default? Perubahan Anda akan hilang.')) return;
    try {
      await fetch('/api/report-templates', { method: 'DELETE' });
      setEkinerjaTemplates([...DEFAULT_EKINERJA_TEMPLATES]);
      setEremunerasiTemplates([...DEFAULT_EREMUNERASI_TEMPLATES]);
      setIsCustom(false);
      toast.success('Template dikembalikan ke default');
    } catch {
      toast.error('Gagal reset');
    }
  };

  const updateTemplate = (
    type: 'ekinerja' | 'eremunerasi',
    index: number,
    field: keyof TemplateItem,
    value: string | number
  ) => {
    const setter = type === 'ekinerja' ? setEkinerjaTemplates : setEremunerasiTemplates;
    setter(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  const addTemplate = (type: 'ekinerja' | 'eremunerasi') => {
    const newItem: TemplateItem = {
      point: type === 'ekinerja' ? 1 : 1,
      category: type === 'ekinerja' ? 'SEMUA_PASIEN' : 'ASESMEN',
      template: '',
    };
    if (type === 'ekinerja') setEkinerjaTemplates(prev => [...prev, newItem]);
    else setEremunerasiTemplates(prev => [...prev, newItem]);
  };

  const removeTemplate = (type: 'ekinerja' | 'eremunerasi', index: number) => {
    if (type === 'ekinerja') setEkinerjaTemplates(prev => prev.filter((_, i) => i !== index));
    else setEremunerasiTemplates(prev => prev.filter((_, i) => i !== index));
  };

  const moveTemplate = (type: 'ekinerja' | 'eremunerasi', index: number, direction: 'up' | 'down') => {
    const setter = type === 'ekinerja' ? setEkinerjaTemplates : setEremunerasiTemplates;
    setter(prev => {
      const arr = [...prev];
      const newIdx = direction === 'up' ? index - 1 : index + 1;
      if (newIdx < 0 || newIdx >= arr.length) return arr;
      [arr[index], arr[newIdx]] = [arr[newIdx], arr[index]];
      return arr;
    });
  };

  const categories = (type: 'ekinerja' | 'eremunerasi') =>
    type === 'ekinerja' ? EKINERJA_CATEGORIES : EREMUNERASI_CATEGORIES;

  const renderTemplateEditor = (type: 'ekinerja' | 'eremunerasi') => {
    const templates = type === 'ekinerja' ? ekinerjaTemplates : eremunerasiTemplates;

    return (
      <div className="space-y-3">
        {templates.map((item, idx) => (
          <Card key={idx} className="border border-slate-200 shadow-sm">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  <div className="w-20">
                    <Input
                      type="number"
                      min={1}
                      value={item.point}
                      onChange={e => updateTemplate(type, idx, 'point', parseInt(e.target.value) || 1)}
                      className="h-8 text-sm text-center"
                      data-testid={`${type}-point-${idx}`}
                    />
                  </div>
                  <Select
                    value={item.category}
                    onValueChange={v => updateTemplate(type, idx, 'category', v)}
                  >
                    <SelectTrigger className="h-8 text-xs w-36" data-testid={`${type}-category-${idx}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories(type).map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge variant="outline" className="text-[10px]">Poin {item.point}</Badge>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveTemplate(type, idx, 'up')} disabled={idx === 0}>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveTemplate(type, idx, 'down')} disabled={idx === templates.length - 1}>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeTemplate(type, idx)} data-testid={`${type}-delete-${idx}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <Textarea
                value={item.template}
                onChange={e => updateTemplate(type, idx, 'template', e.target.value)}
                placeholder="Tulis template dengan shortcode, misal: Melakukan visit kepada pasien [NAMES_ALL_PASIEN]"
                className="text-sm min-h-[60px] resize-y"
                data-testid={`${type}-template-${idx}`}
              />
            </CardContent>
          </Card>
        ))}
        <Button
          variant="outline"
          className="w-full border-dashed border-slate-300 text-slate-500"
          onClick={() => addTemplate(type)}
          data-testid={`${type}-add-btn`}
        >
          <Plus className="w-4 h-4 mr-2" />Tambah Template Baru
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-heading font-bold text-slate-900">Pengaturan Template</h1>
          <p className="text-slate-500 text-sm mt-0.5">Kustomisasi format laporan e-Kinerja & e-Remunerasi</p>
        </div>
        <div className="flex items-center gap-2">
          {isCustom && (
            <Button variant="outline" onClick={handleReset} data-testid="btn-reset-templates" className="text-sm">
              <RotateCcw className="w-4 h-4 mr-1.5" />Reset Default
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving} data-testid="btn-save-templates" className="bg-teal-600 hover:bg-teal-700 text-sm">
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
            Simpan
          </Button>
        </div>
      </div>

      {/* Shortcode Legend */}
      <Card className="border-0 shadow-card bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-3 md:p-4">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="flex items-center justify-between w-full"
            data-testid="toggle-legend"
          >
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-slate-900 text-sm md:text-base">Panduan Shortcode</span>
              <Badge variant="secondary" className="text-[10px]">{SHORTCODES.length} kode</Badge>
            </div>
            {showLegend ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {showLegend && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              {SHORTCODES.map(s => (
                <div key={s.code} className="flex items-start gap-2 p-2 bg-white/70 rounded-lg">
                  <code className="text-xs font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded shrink-0">{s.code}</code>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-700">{s.label}</p>
                    <p className="text-[10px] text-slate-400 truncate">Contoh: {s.example}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <Info className="w-4 h-4 text-amber-500 shrink-0" />
        <span>Gunakan shortcode di dalam template. Contoh: <code className="bg-white px-1 rounded">Melakukan visit kepada pasien [NAMES_ALL_PASIEN]</code></span>
      </div>

      <Tabs defaultValue="ekinerja" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-10 md:h-12 bg-slate-100 rounded-xl p-1">
          <TabsTrigger value="ekinerja" data-testid="tab-ekinerja-settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm">
            <FileCheck className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />e-Kinerja ({ekinerjaTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="eremunerasi" data-testid="tab-eremunerasi-settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs md:text-sm">
            <ClipboardList className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />e-Remunerasi ({eremunerasiTemplates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ekinerja" className="mt-4">
          <ScrollArea className="h-[calc(100vh-400px)] pr-2">
            {renderTemplateEditor('ekinerja')}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="eremunerasi" className="mt-4">
          <ScrollArea className="h-[calc(100vh-400px)] pr-2">
            {renderTemplateEditor('eremunerasi')}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
