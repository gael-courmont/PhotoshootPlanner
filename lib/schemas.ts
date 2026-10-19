import { z } from "zod";

export const localizedTextSchema = z.object({ en: z.string(), fr: z.string() });

export const spotSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: localizedTextSchema,
  description: localizedTextSchema,
  coords: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
  shootMinutes: z.number().int().positive(),
  photos: z
    .array(
      z.object({
        src: z.string(),
        alt: localizedTextSchema,
        w: z.number().int().positive(),
        h: z.number().int().positive(),
        // Small version for map markers and list rows; written by the image pipeline.
        thumb: z.string().optional(),
        // Tiny base64 image shown while the photo loads; written by the image pipeline.
        blurDataURL: z.string().optional(),
      }),
    )
    .min(3)
    .max(8),
});

// A package is just a duration; the label ("2h") is derived.
export const packageSchema = z.object({
  id: z.string(),
  minutes: z.number().int().positive(),
});

export const legSchema = z.object({
  from: z.string(),
  to: z.string(),
  walkMinutes: z.number().nonnegative(),
  meters: z.number().nonnegative(),
  geometry: z.object({
    type: z.literal("LineString"),
    coordinates: z.array(z.tuple([z.number(), z.number()])),
  }),
});

export type LocalizedText = z.infer<typeof localizedTextSchema>;
export type Spot = z.infer<typeof spotSchema>;
export type Package = z.infer<typeof packageSchema>;
export type Leg = z.infer<typeof legSchema>;

// Client state, mirrored in the URL.
export type Selection = {
  packageId: string | null;
  startSpotId: string | null;
  spotIds: string[];
};
