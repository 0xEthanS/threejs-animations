import { Cpu, Zap } from 'lucide-react'
import { EmptyParticles } from './solution-animation'




export default function Soution() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">


                <h2 className="relative z-10 max-w-xl text-4xl font-medium lg:text-5xl">
                    The Soution is to breath life into your AI projects
                </h2>


                <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">




                    <div className="relative space-y-4">
                        <p className="text-muted-foreground">
                            <span className="text-accent-foreground font-bold">
                                We make engineering first solutions.
                            </span> We take real development expertise that transforms your ideas into production 
                            grade systems built to last. 
                        </p>
                        <p className="text-muted-foreground">
                            <span className="text-accent-foreground font-bold">
                                Production ready implementation.
                            </span> We build and deploy production grade AI solutions that integrate seamlessly 
                            into your existing stack. 
                        </p>
                        <p className="text-muted-foreground">
                            <span className="text-accent-foreground font-bold">
                                We build workflows that deliver.
                            </span> Transform scattered data into a unified powerhouse. We build pipelines and 
                            agents that drive efficiency and provide measurable growth. 
                        </p>
                        <p className="text-muted-foreground">
                            <span className="text-accent-foreground font-bold">
                                We buid enterprise grade performance.
                            </span> We build with scalability in mind from day one. We deploy rock solid 
                            infrastructure that handles heavy workloads without breaking a sweat. 
                        </p>

                        <div className="grid grid-cols-2 gap-3 pt-6 sm:gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Zap className="size-4" />
                                    <h3 className="text-sm font-medium">
                                        Faaast
                                    </h3>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    It supports an entire helping developers and innovate.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Cpu className="size-4" />
                                    <h3 className="text-sm font-medium">
                                        Powerful
                                    </h3>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    It supports an entire helping developers and businesses.
                                </p>
                            </div>
                        </div>
                    </div>




                    <div className="relative mt-6 sm:mt-0">
                        <div className="aspect-67/34 relative rounded-2xl p-px overflow-visible 
                                bg-linear-to-b 
                                from-transparent 
                                to-transparent
                            "
                        >
                            <EmptyParticles />
                        </div>
                    </div>




                </div>
            </div>
        </section>
    )
}



