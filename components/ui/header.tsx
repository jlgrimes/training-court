import { PropsWithChildren } from "react";
import { Separator } from "./separator";

interface HeaderProps extends PropsWithChildren {
  description?: string;
  actionButton?: JSX.Element;
}

export const Header = (props: HeaderProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl tracking-wide font-semibold text-slate-800">
            {props.children}
          </h1>
          {props.description && (
            <p className="text-md text-muted-foreground">{props.description}</p>
          )}
        </div>
        {props.actionButton}
      </div>
      <Separator />
  </div>
  )
}