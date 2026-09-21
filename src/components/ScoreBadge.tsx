import { GRADE_HEX, GRADE_LABEL } from "@/lib/calculateNutriScore";
import type { NutriGrade } from "@/lib/types";

const GRADES: NutriGrade[] = ["a", "b", "c", "d", "e"];

interface ScoreBadgeProps {
  grade: NutriGrade;
  size?: "lg" | "md";
}

export default function ScoreBadge({ grade, size = "lg" }: ScoreBadgeProps) {
  const dimension = size === "lg" ? "h-24 w-24 text-4xl" : "h-14 w-14 text-xl";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`flex ${dimension} items-center justify-center rounded-full font-display font-semibold text-white shadow-soft`}
        style={{ backgroundColor: GRADE_HEX[grade] }}
        role="img"
        aria-label={`Nutri-Score grade ${grade.toUpperCase()}: ${GRADE_LABEL[grade]}`}
      >
        {grade.toUpperCase()}
      </div>

      {size === "lg" && (
        <div className="flex overflow-hidden rounded-full shadow-soft">
          {GRADES.map((g) => (
            <div
              key={g}
              className="flex h-8 w-9 items-center justify-center text-xs font-bold text-white transition-all"
              style={{
                backgroundColor: GRADE_HEX[g],
                opacity: g === grade ? 1 : 0.35,
                transform: g === grade ? "scale(1.15)" : "scale(1)",
              }}
            >
              {g.toUpperCase()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
