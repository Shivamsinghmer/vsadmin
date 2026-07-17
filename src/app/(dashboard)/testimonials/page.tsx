import { MessageSquare } from "lucide-react";
import connectToDB from "@/lib/mongoose";
import { Testimonial } from "@/models/Testimonial";
import { TestimonialRow } from "@/components/testimonials/TestimonialRow";
import { CreateTestimonial } from "@/components/testimonials/CreateTestimonial";

export default async function TestimonialsPage() {
  await connectToDB();
  const rawTestimonials = await Testimonial.find().sort({ createdAt: -1 }).lean() as any[];
  const testimonials = JSON.parse(JSON.stringify(rawTestimonials));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Testimonials</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {testimonials.length} customer review{testimonials.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateTestimonial />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col divide-y divide-slate-50">
          {testimonials.length > 0 ? (
            testimonials.map((testim: any) => (
              <TestimonialRow
                key={testim._id.toString()}
                testimonial={{
                  _id: testim._id.toString(),
                  name: testim.name,
                  role: testim.role,
                  company: testim.company,
                  quote: testim.quote,
                  rating: testim.rating,
                  image: testim.image,
                }}
              />
            ))
          ) : (
            <div className="p-16 text-center text-sm text-slate-400">No testimonials yet.</div>
          )}
        </div>

        {testimonials.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
            {testimonials.length} review{testimonials.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
