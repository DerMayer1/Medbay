import Image from "next/image";
import { CalendarCheck, ClipboardList, ExternalLink, Leaf, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { ChatWidget } from "@/components/public/ChatWidget";
import { Particles } from "@/components/public/Particles";
import { PRIVACY_TEXT } from "@/lib/constants";

const benefits = [
  {
    icon: CalendarCheck,
    title: "Pré-agendamento",
    description: "Coleta os dados principais e organiza a solicitação para confirmação da equipe.",
  },
  {
    icon: ClipboardList,
    title: "Triagem administrativa",
    description: "Entende a intenção do paciente sem substituir avaliação nutricional.",
  },
  {
    icon: MessageCircle,
    title: "Dúvidas frequentes",
    description: "Responde sobre modalidades, retorno, valores cadastrados e funcionamento.",
  },
  {
    icon: ShieldCheck,
    title: "Encaminhamento humano",
    description: "Perguntas clínicas e casos sensíveis são enviados para a equipe.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-[#fff8ef] relative selection:bg-orange-500 selection:text-white">
      {/* Background Particles Effect */}
      <Particles />

      <section className="relative border-b border-orange-500/20">
        {/* Gradients for depth */}
        <div
          className="absolute inset-0 opacity-80 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at top right, rgba(217, 121, 52, 0.15), transparent 40%), radial-gradient(circle at bottom left, rgba(217, 121, 52, 0.05), transparent 50%)",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-24 border-b border-white/5 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

        <div className="relative mx-auto grid min-h-[88vh] max-w-7xl gap-10 px-5 pb-10 pt-6 md:grid-cols-[1fr_1fr] md:px-8 lg:px-12">
          
          {/* Header */}
          <header className="col-span-full flex items-center justify-between border-b border-white/10 pb-5 z-10">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 backdrop-blur-sm">
                <Leaf className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide text-[#fff8ef] font-serif">Juliana Pansardi</p>
                <p className="text-xs text-orange-200/60 uppercase tracking-widest">Nutrição & Emagrecimento</p>
              </div>
            </div>
            <a
              href="#atendimento"
              className="hidden rounded-full border border-orange-500/40 px-5 py-2 text-sm font-medium text-orange-200 transition-all hover:border-orange-500 hover:bg-orange-500/10 sm:inline-flex backdrop-blur-md"
            >
              Iniciar Atendimento
            </a>
          </header>

          {/* Left Content Column */}
          <div className="flex flex-col justify-center py-6 z-10">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-orange-300 backdrop-blur-md shadow-[0_0_15px_rgba(217,121,52,0.15)]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Atendimento Premium
            </div>
            <h1 className="max-w-3xl text-4xl font-serif font-medium leading-tight text-[#fff8ef] sm:text-5xl lg:text-6xl drop-shadow-lg">
              Sua jornada de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200">saúde</span> começa aqui.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400 font-light">
              Nossa secretária virtual organiza seu atendimento de forma rápida, segura e elegante. Descomplique o primeiro passo para o seu emagrecimento definitivo.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#atendimento"
                className="group relative rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-8 py-3.5 text-sm font-medium text-white shadow-[0_0_30px_rgba(217,121,52,0.3)] transition-all hover:shadow-[0_0_40px_rgba(217,121,52,0.5)] hover:-translate-y-0.5"
              >
                Falar com a Assistente
                <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity group-hover:opacity-100 mix-blend-overlay"></div>
              </a>
              <a
                href="#como-funciona"
                className="rounded-full border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-medium text-zinc-300 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white"
              >
                Conhecer o Processo
              </a>
            </div>

            <div className="mt-12 grid max-w-2xl gap-6 sm:grid-cols-3 border-t border-white/10 pt-8">
              <div className="flex flex-col">
                <p className="text-2xl font-serif text-orange-400">01</p>
                <p className="mt-2 text-xs uppercase tracking-widest text-zinc-500 font-semibold">Triagem</p>
              </div>
              <div className="flex flex-col">
                <p className="text-2xl font-serif text-orange-400">02</p>
                <p className="mt-2 text-xs uppercase tracking-widest text-zinc-500 font-semibold">Organização</p>
              </div>
              <div className="flex flex-col">
                <p className="text-2xl font-serif text-orange-400">03</p>
                <p className="mt-2 text-xs uppercase tracking-widest text-zinc-500 font-semibold">Evolução</p>
              </div>
            </div>
          </div>

          {/* Right Column: Graphic and Chat Component */}
          <div className="relative flex items-center justify-center lg:justify-end z-10 w-full">
            {/* The beautiful generated image behind the chat widget */}
            <div className="absolute inset-0 right-0 w-full h-full max-w-md ml-auto opacity-40 blur-[2px] rounded-3xl overflow-hidden pointer-events-none">
                <Image
                  src="/hero-bg.png"
                  alt="Abstract Premium Health"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#050505]"></div>
            </div>

            {/* Chat Widget Container with Glassmorphism */}
            <div id="atendimento" className="relative w-full max-w-md">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-b from-orange-500/30 to-transparent opacity-50 blur-sm"></div>
              <div className="relative w-full rounded-2xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl shadow-2xl overflow-hidden">
                <ChatWidget />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="relative bg-[#030303] z-10">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent"></div>
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:px-12">
          <div className="mb-12 max-w-3xl text-center mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">A Excelência no Detalhe</p>
            <h2 className="mt-4 text-3xl font-serif font-medium text-[#fff8ef] sm:text-4xl">Uma experiência fluida e segura.</h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-400 font-light">
              Entendemos a importância de cada passo na sua busca por resultados. Nosso fluxo administrativo é desenhado para otimizar o seu tempo.
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((item) => (
              <article
                key={item.title}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#0a0a0a] p-6 transition-all hover:border-orange-500/30 hover:bg-[#0c0c0c] hover:-translate-y-1"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 to-amber-400 opacity-0 transition-opacity group-hover:opacity-100"></div>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-500/10 text-orange-400 mb-6 transition-transform group-hover:scale-110">
                  <item.icon className="h-6 w-6 stroke-[1.5]" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-medium text-zinc-100 font-serif">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500 group-hover:text-zinc-400 transition-colors">{item.description}</p>
              </article>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <p className="inline-block rounded-full border border-white/5 bg-white/5 px-6 py-3 text-xs leading-relaxed text-zinc-500 backdrop-blur-sm">
              {PRIVACY_TEXT}
            </p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-orange-500/10 bg-[#050505] z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.16),transparent_34%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.05),transparent_32%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-20 md:grid-cols-[0.9fr_1.1fr] md:px-8 lg:px-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">Suplementação</p>
            <h2 className="mt-4 max-w-2xl font-serif text-3xl font-medium leading-tight text-[#fff8ef] sm:text-5xl">
              Produtos selecionados, orientação sempre individual.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400">
              A escolha de suplementos deve considerar objetivo, rotina e avaliação profissional. Para conhecer a linha
              Íris Saúde, acesse o site oficial.
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/10 bg-[#0a0a0a]/85 p-6 shadow-2xl shadow-black/30">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-amber-300" />
            <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="font-serif text-4xl font-semibold tracking-tight text-white">ÍRIS</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-orange-400">
                  Saúde e suplementação
                </p>
                <p className="mt-5 max-w-lg text-sm leading-7 text-zinc-400">
                  Consulte opções diretamente no site da marca. A assistente virtual não indica suplementos nem define
                  protocolos de uso.
                </p>
              </div>
              <a
                href="https://www.irissaude.com.br/?srsltid=AfmBOopxBYdjBTmkI7oib6w2qsf8faNQKjb5BQpmOFsUZL2__0WOyWZY"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-3 text-sm font-medium text-white shadow-[0_0_30px_rgba(217,121,52,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(217,121,52,0.45)]"
              >
                Acessar Íris Saúde
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
