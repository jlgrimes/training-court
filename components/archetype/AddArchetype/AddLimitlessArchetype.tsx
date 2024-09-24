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
import { useEffect, useState } from "react";
import { AddArchetypeProps } from "./AddArchetype";
import { imgSrcToPkmnName, pkmnToImgSrc } from "../sprites/sprites.utils";
import { SpriteFromUrl } from "../sprites/SpriteFromUrl";
import { cn } from "@/lib/utils";
import { useLimitlessSprites } from "../sprites/sprites.hooks";

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
        >
          {selected
            ? <PokemonLabel url={selected} />
            : "Select pokemon..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[300px]">
        <Command>
          <CommandInput placeholder="Search pokemon..." />
          <CommandList>
            <CommandEmpty>No pokemon found.</CommandEmpty>
            <CommandGroup>
              {loadedPokemonUrls?.map((url) => (
                <CommandItem
                  key={url}
                  value={url}
                  onSelect={(currentValue) => {
                    setSelected(currentValue === selected ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected === url ? "opacity-100" : "opacity-0"
                    )}
                  />
                    <PokemonLabel url={url} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}