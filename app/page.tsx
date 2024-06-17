import StoryWriter from "@/components/StoryWriter";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Logo from "@/images/logo.png";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen h-full">
      <section className="p-16 text-center">
        <h1 className="text-6xl font-black">Let AI</h1>
        <div className="flex space-x-5 text-3xl lg:text-5xl justify-center whitespace-nowrap">
          <h2>Bring your stories</h2>
          <div className="relative">
            <div className="absolute bg-purple-500 -left-2 -top-1 -bottom-1 -right-2 md:-left-3 md:-top-0 md:-bottom-0 md:-right-3 -rotate-1 h-" />
            <div className="relative text-white">To life!</div>
          </div>
        </div>

        {/* <p className="italic mt-2">
          Combine Several AI tools with{" "}
          <span className="text-purple-500">GPTScript</span>, a framework that
          allows LLMs to operate & interact with multiple various systems.
        </p> */}
      </section>

      <section className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        <div className="bg-purple-500 flex flex-col space-y-5 justify-center items-center order-1 lg:-order-1 pb-10">
          <Image src={Logo} alt="AI Storyteller" height={250} className="" />

          <Button asChild className="px-20 bg-purple-700 p-10 text-xl">
            <Link href="/stories">Explore story library</Link>
          </Button>
        </div>
        {/* <Image src={Logo} alt="AI Storyteller" /> */}

        <StoryWriter />
      </section>
    </div>
  );
}
