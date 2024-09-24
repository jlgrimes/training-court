import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react";
import { DetailedHTMLProps, HTMLAttributes, JSX, ReactNode, Ref, RefAttributes, useEffect, useState } from "react";
import { AddArchetypeProps } from "./AddArchetype";
import { imgSrcToPkmnName, pkmnToImgSrc } from "../sprites/sprites.utils";
import { SpriteFromUrl } from "../sprites/SpriteFromUrl";
import { cn } from "@/lib/utils";
import { useLimitlessSprites } from "../sprites/sprites.hooks";
import { useCommandState } from "cmdk";

interface PokemonLabelProps {
  url: string;
}

const PokemonLabel = (props: PokemonLabelProps) => {
  return (
   <div className='flex items-center gap-2'>
      <SpriteFromUrl url={props.url} />
      {imgSrcToPkmnName(props.url)}
    </div>
  )
}

const SubItem = (props: JSX.IntrinsicAttributes & Omit<{ children?: ReactNode; } & Omit<Pick<Pick<DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "key" | keyof HTMLAttributes<HTMLDivElement>> & { ref?: Ref<HTMLDivElement>; } & { asChild?: boolean; }, "key" | keyof HTMLAttributes<HTMLDivElement> | "asChild">, "onSelect" | "value" | "disabled"> & { disabled?: boolean; onSelect?: (value: string) => void; value?: string; keywords?: string[]; forceMount?: boolean; } & RefAttributes<HTMLDivElement>, "ref"> & RefAttributes<HTMLDivElement>) => {
  const search = useCommandState((state) => state.search)
  if (!search || search.length < 2) return null
  return <CommandItem {...props} />
}

const PkmnEmptyState = () => {
  const search = useCommandState((state) => state.search)

  if (search.length >= 2) {
    return <CommandEmpty>No pokemon found with name "{search}"</CommandEmpty>
  }

  return <CommandEmpty>Start typing a Pokemon name...</CommandEmpty>
}

export const AddLimitlessArchetype = (props: AddArchetypeProps) => {
  const { data: loadedPokemonUrls } = useLimitlessSprites();

  const [selected, setSelected] = useState(props.defaultArchetype ? pkmnToImgSrc(props.defaultArchetype) : undefined);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    props.defaultArchetype && setSelected(pkmnToImgSrc(props.defaultArchetype));
  }, [props.defaultArchetype]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-[300px]"
          disabled={props.isDisabled}
        >
          {selected
            ? <PokemonLabel url={selected} />
            : "Select pokemon..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[300px]">
        <Command   filter={(value, search) => {
          if (imgSrcToPkmnName(value).includes(search.toLowerCase().replace(' ', '-'))) return 1
          return 0
        }}>
          <CommandInput placeholder="Search pokemon..."/>
          <CommandList>
          <PkmnEmptyState />
            <CommandGroup>
              {loadedPokemonUrls?.map((url) => (
                <SubItem
                  key={url}
                  value={url}
                  onSelect={(currentValue) => {
                    setSelected(currentValue === selected ? "" : currentValue);
                    props.setArchetype(currentValue === selected ? "" : imgSrcToPkmnName(currentValue));
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected === url ? "opacity-100" : "opacity-0"
                    )}
                  />
                    <PokemonLabel url={url} />
                </SubItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}