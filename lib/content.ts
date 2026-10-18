import { z } from "zod";
import legsJson from "@/content/legs.json";
import packagesJson from "@/content/packages.json";
import spotsJson from "@/content/spots.json";
import { legSchema, packageSchema, spotSchema } from "./schemas";

export const spots = z.array(spotSchema).parse(spotsJson);
export const packages = z.array(packageSchema).parse(packagesJson);
export const legs = z.array(legSchema).parse(legsJson);
