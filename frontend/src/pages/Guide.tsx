export default function Guide() {
  return (
    <div className="min-h-screen" style={{ fontFeatureSettings: "'ss01' 1, 'cv01' 1" }}>
      {/* Hero — asymmetrical, layered */}
      <section className="relative overflow-hidden bg-linear-to-br from-accent/8 via-background to-secondary/10 py-20 px-6">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, var(--primary) 1px, transparent 1px), radial-gradient(circle at 80% 70%, var(--accent) 1px, transparent 1px)",
          backgroundSize: "60px 60px, 80px 80px",
        }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-xs tracking-[0.2em] text-accent font-medium mb-4 uppercase">Digital Cave · User Guide</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            数字洞府使用指南
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            从碎片到结构化的知识消化系统
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            由银月与幻梦共建 · 2026
          </div>
        </div>
      </section>

      {/* Core Operations — 3-column stagger */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase mb-2">Core Flow</p>
        <h2 className="text-2xl font-bold text-foreground mb-10">三大核心操作</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "扔进去",
              desc: "在收件箱输入任何想法、链接、灵感。AI 自动解析标题、分类、标签、摘要，一键确认即可入库。",
              emoji: "📥",
              gradient: "from-accent/5 to-primary/5",
            },
            {
              step: "02",
              title: "找回来",
              desc: "全局搜索跨越全部模块。搜一个关键词，瞬间命中收件箱、法器阁、功法库、文献库等所有角落。",
              emoji: "🔍",
              gradient: "from-primary/5 to-accent/5",
            },
            {
              step: "03",
              title: "逛一逛",
              desc: "法器阁收纳工具，功法库存放方法论，丹房沉淀文献。四大库按领域分类，随时浏览、检索、更新。",
              emoji: "🏛",
              gradient: "from-secondary/10 to-accent/5",
            },
          ].map((op, i) => (
            <div
              key={op.step}
              className="group relative rounded-xl border border-border/40 bg-card p-6 hover:shadow-lg hover:border-accent/30 transition-all duration-500"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-linear-to-r ${op.gradient}`} />
              <span className="text-3xl mb-4 block">{op.emoji}</span>
              <span className="text-[10px] tracking-[0.2em] text-muted-foreground/50 font-mono">{op.step}</span>
              <h3 className="text-lg font-semibold mt-1 mb-2 text-foreground group-hover:text-accent transition-colors">{op.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{op.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Module Gallery — screenshot + description pairs */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-border/30">
        <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase mb-2">Modules</p>
        <h2 className="text-2xl font-bold text-foreground mb-2">洞府模块一览</h2>
        <p className="text-sm text-muted-foreground mb-10">九个模块，覆盖知识消化的完整生命周期。</p>

        <div className="space-y-16">
          {[
            {
              title: "仪表盘 · Dashboard",
              desc: "洞府全景视图。顶部银月问候 + AI 洞察，中部模块统计网格，底部洞府动态时间线展示最近收录和炼化记录。",
              img: "/screenshots/01-dashboard.png",
              label: "首页",
            },
            {
              title: "收件箱 · Inbox",
              desc: "一切知识的入口。输入文本后 AI 自动解析标题、分类、标签、摘要和心情。支持自然语言描述，AI 会推荐最合适的入库目标。",
              img: "/screenshots/02-inbox-input.png",
              label: "录入",
            },
            {
              title: "AI 解析结果",
              desc: "解析完成后展示结构化卡片：标题、分类模块、标签、核心摘要、行动建议。确认无误后一键入库到目标模块——也可以手动切换入库目标。",
              img: "/screenshots/03-inbox-parsed.png",
              label: "解析",
            },
            {
              title: "法器阁 · Tools",
              desc: "工具资源库。存储所有 AI 工具、软件、平台。每条记录包含名称、链接、核心能力、初始化脚本、评分和使用记录。",
              img: "/screenshots/04-tools.png",
              label: "工具",
            },
            {
              title: "功法库 · Methods",
              desc: "方法流程库。沉淀方法论、工作流程、学习笔记。每条记录标注掌握状态、学习日期、存储位置和关联知识。",
              img: "/screenshots/05-methods.png",
              label: "方法",
            },
            {
              title: "全局搜索",
              desc: "跨模块全文检索。输入关键词瞬间返回所有匹配——收件箱、工具、方法、文献、AI 引擎……一个搜索框打通全部知识。",
              img: "/screenshots/06-search.png",
              label: "搜索",
            },
            {
              title: "入库操作",
              desc: "点击入库按钮，下拉菜单显示所有可选目标模块。AI 推荐的目标会高亮标注。选择后数据从收件箱迁移到目标模块，状态更新为「已炼化」。",
              img: "/screenshots/07-inbox-route.png",
              label: "入库",
            },
            {
              title: "全流程总览",
              desc: "从收件箱输入 → AI 解析 → 确认入库 → 目标模块可查 → 搜索可命中 —— 完整的知识消化闭环。",
              img: "/screenshots/08-panorama.png",
              label: "全景",
            },
          ].map((mod, i) => (
            <div
              key={mod.title}
              className="flex flex-col md:flex-row gap-8 items-start"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="md:w-5/12 shrink-0">
                <div className="rounded-xl overflow-hidden border border-border/20 shadow-lg shadow-accent/5 group hover:shadow-xl hover:shadow-accent/10 transition-shadow duration-500">
                  <img
                    src={mod.img}
                    alt={mod.title}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="md:w-7/12 pt-2">
                <span className="text-[10px] tracking-[0.2em] text-accent font-medium uppercase bg-accent/5 px-2 py-0.5 rounded-full">{mod.label}</span>
                <h3 className="text-xl font-bold text-foreground mt-3 mb-2">{mod.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{mod.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Philosophy — minimal, centered */}
      <section className="max-w-3xl mx-auto px-6 py-20 border-t border-border/30">
        <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase mb-2 text-center">Philosophy</p>
        <h2 className="text-2xl font-bold text-foreground mb-10 text-center">核心心法</h2>

        <div className="grid grid-cols-2 gap-px bg-border/20 rounded-xl overflow-hidden">
          {[
            { title: "收件箱", sub: "是唯一入口", detail: "所有信息先进入收件箱，不直接操作目标模块。这是保持洞府整洁的第一原则。" },
            { title: "炼化", sub: "是仪式", detail: "AI 解析 + 人工确认 = 从碎片到结构化。跳过炼化的收集只是堆积。" },
            { title: "四大库", sub: "是精华", detail: "法器阁、功法库、丹房、AI引擎库——四个模块承载了洞府的知识内核。" },
            { title: "关联", sub: "是灵魂", detail: "知识不孤岛。标签、引用、模块间跳转让洞府成为一个有机网络而非文件柜。" },
          ].map((p) => (
            <div key={p.title} className="bg-card p-6 group hover:bg-accent/[0.03] transition-colors duration-300">
              <h3 className="text-lg font-semibold text-foreground">
                {p.title}<span className="text-muted-foreground font-normal"> {p.sub}</span>
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{p.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-10 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">数字洞府</span> · 开源知识管理系统
          </p>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground/60">
            <a
              href="https://github.com/hanli1999/digital-brain"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors underline decoration-border underline-offset-4"
            >
              GitHub 开源
            </a>
            <span className="text-border">·</span>
            <span>设计 & 开发：幻梦</span>
            <span className="text-border">·</span>
            <span>QA & 验收：银月</span>
          </div>
          <p className="text-xs text-muted-foreground/40 mt-4">
            以修仙之姿，行知识管理之实。洞府常开，欢迎来访。
          </p>
        </div>
      </footer>
    </div>
  );
}
