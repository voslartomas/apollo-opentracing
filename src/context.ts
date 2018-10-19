import { Span } from "opentracing";
import { GraphQLResolveInfo, ResponsePath } from "graphql";

export function buildPath(path: ResponsePath) {
  let current: ResponsePath | undefined = path;
  const segments = [];
  while (current != null) {
    if (typeof current.key === "number") {
      segments.push(`[${current.key}]`);
    } else {
      segments.push(current.key);
    }
    current = current.prev;
  }
  return segments.reverse().join(".");
}

export interface SpanContext extends Object {
  _spans: Map<string, Span>;
  getSpanByPath(info: ResponsePath): Span | undefined;
  addSpan(span: Span, info: GraphQLResolveInfo): void;
}

function isSpanContext(obj: any): obj is SpanContext {
  return (
    obj.getSpanByPath instanceof Function && obj.addSpan instanceof Function
  );
}

// TODO: think about using symbols to hide these
export function addContextHelpers(obj: any): SpanContext {
  if (isSpanContext(obj)) {
    return obj;
  }

  obj._spans = new Map<string, Span>();
  obj.getSpanByPath = function(path: ResponsePath): Span | undefined {
    return this._spans.get(buildPath(path));
  };

  obj.addSpan = function(span: Span, info: GraphQLResolveInfo): void {
    this._spans.set(buildPath(info.path), span);
  };

  return obj;
}