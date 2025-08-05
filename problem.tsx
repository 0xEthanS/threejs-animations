import { Cpu, Zap } from 'lucide-react'
import { LinenInTheWind } from './problem-animation'




export default function Problem() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
                <h2 className="relative z-10 max-w-xl text-4xl font-medium lg:text-5xl">
                    The Problem is you're doing AI Wrong
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">




                    <div className="relative space-y-4">
                        <p className="text-muted-foreground">
                            <span className="text-accent-foreground font-bold">
                                Most organizations are stumbling in the dark when it comes to AI.
                            </span> Your 
                            AI projects need direction. You may be spending too much on API calls 
                            and need cost effective, sustainable solutions
                        </p>
                        <p className="text-muted-foreground">
                            <span className="text-accent-foreground font-bold">Your data is being wasted.</span> You may have millions of documents, spreadsheets, 
                            and legacy systems full of valuable untapped value. Without proper processing 
                            it's just collecting dust.
                        </p>
                        <p className="text-muted-foreground">
                            <span className="text-accent-foreground font-bold">
                                Your AI application is stuck.
                            </span> You have a great idea, but it's just stuck behind 
                            technical barriers. Your team doesn't need to become AI experts. Stop watching 
                            competitors pass you by while you try to figure out how to make AI work.
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
                            <LinenInTheWind />
                        </div>
                    </div>




                </div>
            </div>
        </section>
    )
}



