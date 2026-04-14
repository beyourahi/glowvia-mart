import {redirect} from "react-router";
import type {Route} from "./+types/contact";

export const loader = async (_: Route.LoaderArgs): Promise<never> => {
    throw redirect("/faq", 301);
};
