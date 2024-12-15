import React from "react";
import {
  Button,
  Card,
  Center,
  Container,
  Grid,
  Notification,
  ScrollArea,
  Title,
} from "@mantine/core";
import { IconMicrophone, IconMicrophoneOff } from "@tabler/icons-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import MarkdownPreview from "@uiw/react-markdown-preview";

function Speech(): JSX.Element {
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  const previousChunk = React.useRef<number>(0);
  const chunkResume = React.useRef<number>(import.meta.env.VITE_CHUNK_RESUME);
  const [isListening, setIsListening] = React.useState<Boolean>(false);
  const [transcription, setTranscription] = React.useState<string>("");
  const chatHistory = React.useRef<
    { role: string; parts: { text: string }[] }[]
  >([]);
  const [chatResponse, setChatResponse] = React.useState<
    string | null | undefined
  >("");

  const startAudioTranscription = async () => {
    chatHistory.current.push({
      role: "user",
      parts: [
        {
          text: "Você está conectado a um audio transcriptor então não faça os resumos excessivamente. Não coloque nada no texto que não seja o que eu pedi, coisas como. Aqui esta... ou Este é... sujam o texto. A formatação do texto deve ser com markdown",
        },
      ],
    });
    chatHistory.current.push({
      role: "user",
      parts: [
        {
          text: `O que vou dizer agora é uma transcrição de uma reunião, preciso que você pegue os textos e faça uma ata da reunião separando em tópicos`,
        },
      ],
    });
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser doesn't support speech recognition");
    }
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "pt-BR";

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("");
        IAResume(transcript);
        setTranscription(transcript);
      };

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Erro no reconhecimento de voz:", event.error);
        setIsListening(false);
      };
    }

    recognitionRef.current.start();
  };

  const stopTranscription = () => {
    previousChunk.current = 0;
    chatHistory.current = [];
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const toggleTranscription = async () => {
    if (isListening) {
      stopTranscription();
    } else {
      await startAudioTranscription();
    }
  };

  const IAResume = async (userMessage: string) => {
    if (!(userMessage.length > previousChunk.current + chunkResume.current)) {
      return;
    }
    previousChunk.current = userMessage.length;
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const chat = model.startChat({
        history: chatHistory.current,
      });
      const result = await chat.sendMessage(userMessage);
      const response = result.response.text();
      const text = response;
      setChatResponse(response);
      chatHistory.current.push({
        parts: [{ text: userMessage }],
        role: "user",
      });
      chatHistory.current.push({
        role: "model",
        parts: [{ text: text }],
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Container size="xl">
      <Notification
        my="xl"
        withCloseButton={false}
        icon={isListening ? <IconMicrophone /> : <IconMicrophoneOff />}
        color={isListening ? "green" : "red"}
        title={
          isListening
            ? "O áudio está sendo transcrito"
            : "Nada está sendo transcrito neste momento"
        }
      />
      <Grid columns={2}>
        <Grid.Col span={1}>
          <Card shadow="sm" padding="lg" radius="md">
            <Title order={3}>Transcrição</Title>
            <ScrollArea>
              <div>
                <ScrollArea h={500} offsetScrollbars scrollHideDelay={0}>
                  {transcription || "Nenhuma transcrição disponível..."}
                </ScrollArea>
              </div>
            </ScrollArea>
          </Card>
        </Grid.Col>
        <Grid.Col span={1}>
          <Card bg="#0D1117" shadow="sm" padding="lg" radius="md">
            <Title style={{ color: "white" }} order={3}>
              Resumo IAEcho+
            </Title>
            <ScrollArea h={500} offsetScrollbars scrollHideDelay={0}>
              <MarkdownPreview
                source={chatResponse || "Nenhuma resposta disponível..."}
              />
            </ScrollArea>
          </Card>
        </Grid.Col>
      </Grid>
      <Center mt="xl">
        <Button onClick={toggleTranscription}>
          {isListening ? "Parar Transcrição" : "Iniciar Transcrição"}
        </Button>
      </Center>
    </Container>
  );
}

export default Speech;
