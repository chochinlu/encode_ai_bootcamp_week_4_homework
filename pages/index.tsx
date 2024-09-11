import Head from "next/head";
import { ChangeEvent, useId, useState, useRef, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkedSlider } from "@/components/ui/linkedslider";
import { Textarea } from "@/components/ui/textarea";
import essay from "@/lib/essay";
import { SUMMARY_CHARACTERS_PROMPT } from "@/prompts/prompts";

const DEFAULT_CHUNK_SIZE = 1024;
const DEFAULT_CHUNK_OVERLAP = 20;
const DEFAULT_TOP_K = 2;
const DEFAULT_TEMPERATURE = 0.1;
const DEFAULT_TOP_P = 1;

export default function Home() {
  const answerId = useId();
  const queryId = useId();
  const sourceId = useId();
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [needsNewIndex, setNeedsNewIndex] = useState(true);
  const [buildingIndex, setBuildingIndex] = useState(false);
  const [runningQuery, setRunningQuery] = useState(false);
  const [nodesWithEmbedding, setNodesWithEmbedding] = useState([]);
  const [chunkSize, setChunkSize] = useState(DEFAULT_CHUNK_SIZE.toString());
  //^ We're making all of these strings to preserve things like the user typing "0."
  const [chunkOverlap, setChunkOverlap] = useState(
    DEFAULT_CHUNK_OVERLAP.toString(),
  );
  const [topK, setTopK] = useState(DEFAULT_TOP_K.toString());
  const [temperature, setTemperature] = useState(
    DEFAULT_TEMPERATURE.toString(),
  );
  const [topP, setTopP] = useState(DEFAULT_TOP_P.toString());
  const [answer, setAnswer] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [indexStatus, setIndexStatus] = useState("");
  const [parsedAnswer, setParsedAnswer] = useState<any>(null);
  const answerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (answer && answer !== "Running query...") {
      try {
        const parsed = JSON.parse(answer);
        setParsedAnswer(parsed);
      } catch (error) {
        console.error('Cannot parse JSON:', error);
        setParsedAnswer(null);
      }
    } else {
      setParsedAnswer(null);
    }
  }, [answer]);

  useEffect(() => {
    if (parsedAnswer && parsedAnswer.characters && answerContainerRef.current) {
      answerContainerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [parsedAnswer]);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setText(content);
        setNeedsNewIndex(true);
      };
      reader.readAsText(file);
    } else {
      alert("Please upload a .txt file");
    }
  };

  return (
    <>
      <Head>
        <title>LlamaIndex.TS Playground</title>
      </Head>
      <main className="mx-2 flex min-h-screen flex-col lg:mx-56 my-5">
        <div className="space-y-2">
          <Label>Settings:</Label>
          <div>
            <LinkedSlider
              label="Chunk Size:"
              description={
                "The maximum size of the chunks we are searching over, in tokens. " +
                "The bigger the chunk, the more likely that the information you are looking " +
                "for is in the chunk, but also the more likely that the chunk will contain " +
                "irrelevant information."
              }
              min={1}
              max={3000}
              step={1}
              value={chunkSize}
              onChange={(value: string) => {
                setChunkSize(value);
                setNeedsNewIndex(true);
              }}
            />
          </div>
          <div>
            <LinkedSlider
              label="Chunk Overlap:"
              description={
                "The maximum amount of overlap between chunks, in tokens. " +
                "Overlap helps ensure that sufficient contextual information is retained."
              }
              min={1}
              max={600}
              step={1}
              value={chunkOverlap}
              onChange={(value: string) => {
                setChunkOverlap(value);
                setNeedsNewIndex(true);
              }}
            />
          </div>
        </div>
        <div className="my-2 flex flex-auto flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Text File
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt"
              className="hidden"
            />
          </div>
          {text && (
            <>
              <Label htmlFor={sourceId}>Source text:</Label>
              <div className="relative">
                <Textarea
                  id={sourceId}
                  value={text}
                  className="h-[30em] resize-none overflow-auto"
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                    setText(e.target.value);
                    setNeedsNewIndex(true);
                  }}
                />
              </div>
              <Button
                disabled={!needsNewIndex || buildingIndex || runningQuery}
                onClick={async () => {
                  setIndexStatus("Building index...");
                  setBuildingIndex(true);
                  setNeedsNewIndex(false);
                  // Post the text and settings to the server
                  const result = await fetch("/api/splitandembed", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      document: text,
                      chunkSize: parseInt(chunkSize),
                      chunkOverlap: parseInt(chunkOverlap),
                    }),
                  });
                  const { error, payload } = await result.json();

                  if (error) {
                    setIndexStatus(`Error: ${error}`);
                  }

                  if (payload) {
                    setNodesWithEmbedding(payload.nodesWithEmbedding);
                    setIndexStatus("Index built successfully!");
                  }

                  setBuildingIndex(false);
                }}
              >
                {buildingIndex ? "Building Vector index..." : "Build index"}
              </Button>
              {indexStatus && (
                <div className="mt-2 text-sm font-medium text-gray-700">
                  {indexStatus}
                </div>
              )}
            </>
          )}
        </div>
        {!buildingIndex && !needsNewIndex && (
          <>
            <LinkedSlider
              className="my-2"
              label="Top K:"
              description={
                "The maximum number of chunks to return from the search. " +
                "It's called Top K because we are retrieving the K nearest neighbors of the query."
              }
              min={1}
              max={15}
              step={1}
              value={topK}
              onChange={(value: string) => {
                setTopK(value);
              }}
            />

            <LinkedSlider
              className="my-2"
              label="Temperature:"
              description={
                "Temperature controls the variability of model response. Adjust it " +
                "downwards to get more consistent responses, and upwards to get more diversity."
              }
              min={0}
              max={1}
              step={0.01}
              value={temperature}
              onChange={(value: string) => {
                setTemperature(value);
              }}
            />

            <LinkedSlider
              className="my-2"
              label="Top P:"
              description={
                "Top P is another way to control the variability of the model " +
                "response. It filters out low probability options for the model. It's " +
                "recommended by OpenAI to set temperature to 1 if you're adjusting " +
                "the top P."
              }
              min={0}
              max={1}
              step={0.01}
              value={topP}
              onChange={(value: string) => {
                setTopP(value);
              }}
            />

            <div className="my-2 space-y-2">
              <Label htmlFor={queryId}>Query:</Label>
              <div className="flex w-full space-x-2">
                <Button
                  type="submit"
                  disabled={needsNewIndex || buildingIndex || runningQuery}
                  onClick={async () => {
                    setAnswer("Running query...");
                    setRunningQuery(true);
                    // Post the query and nodesWithEmbedding to the server
                    const result = await fetch("/api/retrieveandquery", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        query: SUMMARY_CHARACTERS_PROMPT,
                        nodesWithEmbedding,
                        topK: parseInt(topK),
                        temperature: parseFloat(temperature),
                        topP: parseFloat(topP),
                      }),
                    });

                    const { error, payload } = await result.json();

                    if (error) {
                      setAnswer(error);
                    }

                    if (payload) {
                      setAnswer(payload.response);
                      // console.log(payload.response);
                    }

                    setRunningQuery(false);
                  }}
                >
                  Generate Characters Summary
                </Button>
              </div>
            </div>
            <div className="my-2 flex h-1/4 flex-auto flex-col space-y-2">
              {parsedAnswer && parsedAnswer.characters ? (
                <div ref={answerContainerRef}>
                  <div className="overflow-auto border rounded max-h-[400px]">
                    <table className="w-full border-collapse text-sm">
                      <thead className="sticky top-0 bg-blue-900">
                        <tr>
                          <th className="border p-2 text-left font-bold">Name</th>
                          <th className="border p-2 text-left font-bold">Description</th>
                          <th className="border p-2 text-left font-bold">Personality</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {parsedAnswer.characters.map((character: any, index: number) => (
                          <tr key={index}>
                            <td className="border p-2">{character.name}</td>
                            <td className="border p-2">{character.description}</td>
                            <td className="border p-2">{character.personality}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      // 這裡添加生成故事的邏輯
                      console.log("Generate a story");
                    }}
                  >
                    Generate a Story
                  </Button>
                </div>
              ) : (
                <div className="flex-1 p-2 border rounded">{answer}</div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
