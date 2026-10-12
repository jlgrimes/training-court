'use client';

import type { AdminFeedback } from "./feedback.types";
import { T } from "gt-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "../ui/badge";
import { formatDistanceToNowStrict } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";

interface FeedbackCardProps {
  feedback: AdminFeedback;
}

export const FeedbackCard = (props: FeedbackCardProps) => {
  const { toast } = useToast();
  const [isFixed, setIsFixed] = useState(props.feedback.is_fixed);

  useEffect(() => {
    setIsFixed(props.feedback.is_fixed);
  }, [props.feedback.is_fixed]);

  const onResolveClick = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from("feedback")
      .update({ is_fixed: true })
      .eq("id", props.feedback.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message,
      });
    } else {
      setIsFixed(true);
      toast({
        title: "resolved :)",
      });
    }
  }, [props.feedback.id, toast]);

  return (
    <Card className="w-full max-w-full h-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 break-words">
          {`${props.feedback.feature_name} > ${props.feedback.bug_type}`}
          {isFixed && (
            <Badge
              variant="secondary"
              className="bg-green-200 ml-1"
            >
              Resolved
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="break-words">
          {formatDistanceToNowStrict(props.feedback.created_at, {
            addSuffix: true,
          })}
        </CardDescription>
        <CardDescription className="break-words">
          <T id="admin.feedback.email">Email</T>{": "}
          {props.feedback.email ? (
            <a
              href={`mailto:${encodeURIComponent(props.feedback.email)}`}
              className="break-all text-primary underline underline-offset-4"
            >
              {props.feedback.email}
            </a>
          ) : (
            <T id="admin.feedback.emailUnavailable">Email unavailable</T>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap break-words">
          {props.feedback.description}
        </p>
        {props.feedback.dev_notes && (
          <CardDescription className="mt-2 break-words">
            Dev notes: {props.feedback.dev_notes}
          </CardDescription>
        )}
        {!isFixed && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={onResolveClick}
          >
            Resolve
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
