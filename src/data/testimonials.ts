export interface Testimonial {
    id: string;
    stars: number;
    text: string;
    name: string;
    role: string;
    image: string;
    featured?: boolean;
}

export const testimonials: Testimonial[] = [
    {
        id: "1",
        stars: 5.0,
        text: "Working with Innocent was very eye-opening for us. He helped us simplify our pitch and clearly explain our idea without using too many words. His guidance played a big role in helping us win our very first pitch competition. He made time for us and took us through everything step by step. One thing that really stayed with us was how he taught us to make people feel the problem we were solving. He showed us how to use real-life numbers to explain how big the problem is and how badly it affects people.",
        name: "Evans Kumi",
        role: "CEO, AfyaAI Lab",
        image: "/testimonials/evans.jpg",
        featured: true,
    },
    {
        id: "2",
        stars: 5.0,
        text: "The coaching session with Innocent was very insightful. He gave precise instructions on the layout of the presentation and went the extra mile to give feedback on how each slide could be improved. The insights from the session led to a stellar pitch presentation which impressed the panel and won the venture some funding.",
        name: "Allen Kpentey",
        role: "CEO, Todoke",
        image: "/testimonials/allen.jpg",
    }
];
