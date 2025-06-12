import { Threads } from "./components/Silk"; // Supondo que o caminho esteja correto
import LoginForm from "./components/login-form";
import { TrueFocus } from "./components/title";

export default function LoginPage() {
  return (
    <div className="relative grid min-h-svh place-items-center overflow-hidden bg-[#1C1D1F] p-4">
      
      {/* Background (sem alterações) */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <Threads
          amplitude={1}
          distance={0}
          enableMouseInteraction={true}
        />
      </div>

      {/* 1. Container de Conteúdo Principal */}
      {/* Este é o único item que o 'place-items-center' irá centralizar. */}
      {/* - 'flex flex-col items-center' organiza o título e o formulário em um bloco vertical e centralizado. */}
      {/* - 'relative z-10' garante que todo o bloco fique acima do background. */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* 2. Título */}
        {/* Adicionamos uma margem inferior para separar do formulário */}
        <div className="mb-10">
          <TrueFocus 
            sentence="Building your future"
            manualMode={true}
            blurAmount={5}
            borderColor="9F9F9F"
            glowColor="rgba(156, 140, 242, 0.5)"
            animationDuration={1}
            pauseBetweenAnimations={1}
          />
        </div>

        {/* 3. Formulário */}
        {/* Este é o container do formulário, que agora está alinhado dentro do flex container principal. */}
        <div className="w-full max-w-sm rounded-xl bg-black/20 p-8 shadow-2xl backdrop-blur-lg">
            <LoginForm />
        </div>

      </div>

    </div>
  );
}