import {redirect, type MetaFunction} from "react-router";

export const meta: MetaFunction = () => {
    return [
        {title: "Redirecting..."},
        {name: "robots", content: "noindex"}
    ];
};

export const loader = async () => {
    return redirect("/collections/all-products");
};

export {RouteErrorBoundary as ErrorBoundary} from "~/components/RouteErrorBoundary";
