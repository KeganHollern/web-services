#!/usr/bin/env bash
# Generate images via xAI's Grok Imagine API and save them to /tmp/.
# Prints absolute output paths to stdout, one per line.

set -euo pipefail

usage() {
    cat <<'EOF'
Usage: generate.sh [options] [prompt]

Generate images via xAI's Grok Imagine API. Output files are written to
/tmp/<slug>-<timestamp>[-<index>].png and absolute paths are printed to
stdout (one per line). The caller is responsible for moving the files
wherever they're actually needed.

Options:
  --prompt <text>          Text prompt (alternative to positional arg).
  --model <id>             xAI image model id.
                           Default: grok-imagine-image-pro
  --aspect-ratio <ratio>   Aspect ratio. Default: auto
                           Supported: 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3,
                           2:1, 1:2, 19.5:9, 9:19.5, 20:9, 9:20, auto
  --resolution <res>       1k or 2k. Default: 1k
  --n <count>              Number of images, 1-10. Default: 1
  --name <slug>            Output filename slug (otherwise derived from
                           the prompt).
  -h, --help               Show this help.

Required environment:
  XAI_API_KEY              xAI API key (Bearer auth).
EOF
}

PROMPT=""
MODEL="grok-imagine-image-pro"
ASPECT_RATIO="auto"
RESOLUTION="1k"
N=1
NAME=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --prompt)
            [[ $# -ge 2 ]] || { echo "Error: --prompt requires a value" >&2; exit 2; }
            PROMPT="$2"; shift 2 ;;
        --model)
            [[ $# -ge 2 ]] || { echo "Error: --model requires a value" >&2; exit 2; }
            MODEL="$2"; shift 2 ;;
        --aspect-ratio|--aspect_ratio)
            [[ $# -ge 2 ]] || { echo "Error: --aspect-ratio requires a value" >&2; exit 2; }
            ASPECT_RATIO="$2"; shift 2 ;;
        --resolution)
            [[ $# -ge 2 ]] || { echo "Error: --resolution requires a value" >&2; exit 2; }
            RESOLUTION="$2"; shift 2 ;;
        --n|--count)
            [[ $# -ge 2 ]] || { echo "Error: --n requires a value" >&2; exit 2; }
            N="$2"; shift 2 ;;
        --name)
            [[ $# -ge 2 ]] || { echo "Error: --name requires a value" >&2; exit 2; }
            NAME="$2"; shift 2 ;;
        -h|--help)
            usage; exit 0 ;;
        --)
            shift
            if [[ $# -gt 0 ]]; then PROMPT="$*"; fi
            break ;;
        -*)
            echo "Error: unknown option '$1'" >&2
            usage >&2
            exit 2 ;;
        *)
            if [[ -z "$PROMPT" ]]; then PROMPT="$1"; else PROMPT="$PROMPT $1"; fi
            shift ;;
    esac
done

if [[ -z "${XAI_API_KEY:-}" ]]; then
    echo "Error: XAI_API_KEY is not set." >&2
    echo "Export it in your shell profile, e.g. ~/.zshrc:" >&2
    echo "    export XAI_API_KEY=xai-..." >&2
    exit 1
fi

if [[ -z "$PROMPT" ]]; then
    echo "Error: prompt is required." >&2
    usage >&2
    exit 2
fi

if ! [[ "$N" =~ ^[1-9]$|^10$ ]]; then
    echo "Error: --n must be an integer between 1 and 10 (got '$N')." >&2
    exit 2
fi

for bin in curl jq base64 file; do
    if ! command -v "$bin" >/dev/null 2>&1; then
        echo "Error: required tool '$bin' is not on PATH." >&2
        exit 1
    fi
done

# Pick a file extension from a decoded image's mime type. xAI returns JPEG
# in practice but the field is undocumented, so detect rather than assume.
detect_ext() {
    local f="$1"
    local mime
    mime="$(file --mime-type -b "$f" 2>/dev/null || echo "")"
    case "$mime" in
        image/png)  printf 'png' ;;
        image/jpeg) printf 'jpg' ;;
        image/webp) printf 'webp' ;;
        image/gif)  printf 'gif' ;;
        *)          printf 'bin' ;;
    esac
}

# Pick base64 decode flag (-d is GNU/modern macOS; -D is older BSD).
if printf '' | base64 -d >/dev/null 2>&1; then
    B64_DECODE=(base64 -d)
elif printf '' | base64 -D >/dev/null 2>&1; then
    B64_DECODE=(base64 -D)
else
    echo "Error: no working base64 decode flag (-d or -D)." >&2
    exit 1
fi

slugify() {
    local s="$1"
    s="$(printf '%s' "$s" | tr '[:upper:]' '[:lower:]')"
    s="$(printf '%s' "$s" | LC_ALL=C sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')"
    s="$(printf '%s' "$s" | cut -c1-40)"
    s="$(printf '%s' "$s" | LC_ALL=C sed -E 's/-+$//')"
    if [[ -z "$s" ]]; then s="image"; fi
    printf '%s' "$s"
}

if [[ -n "$NAME" ]]; then
    SLUG="$(slugify "$NAME")"
else
    SLUG="$(slugify "$PROMPT")"
fi

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

PAYLOAD="$(jq -n \
    --arg prompt "$PROMPT" \
    --arg model "$MODEL" \
    --arg aspect_ratio "$ASPECT_RATIO" \
    --arg resolution "$RESOLUTION" \
    --argjson n "$N" \
    '{
        prompt: $prompt,
        model: $model,
        aspect_ratio: $aspect_ratio,
        resolution: $resolution,
        n: $n,
        response_format: "b64_json"
    }')"

RESPONSE_FILE="$(mktemp -t grok-imagine.XXXXXX)"
trap 'rm -f "$RESPONSE_FILE"' EXIT

HTTP_CODE="$(curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
    -X POST "https://api.x.ai/v1/images/generations" \
    -H "Authorization: Bearer $XAI_API_KEY" \
    -H "Content-Type: application/json" \
    --data-binary "$PAYLOAD")"

if [[ "$HTTP_CODE" -lt 200 || "$HTTP_CODE" -ge 300 ]]; then
    echo "xAI API error (HTTP $HTTP_CODE):" >&2
    cat "$RESPONSE_FILE" >&2
    echo >&2
    exit 1
fi

if ! jq -e '.data | type == "array"' "$RESPONSE_FILE" >/dev/null 2>&1; then
    echo "Unexpected response shape from xAI API:" >&2
    cat "$RESPONSE_FILE" >&2
    echo >&2
    exit 1
fi

COUNT="$(jq -r '.data | length' "$RESPONSE_FILE")"
if [[ -z "$COUNT" || "$COUNT" -eq 0 ]]; then
    echo "API returned no images." >&2
    cat "$RESPONSE_FILE" >&2
    echo >&2
    exit 1
fi

PATHS=()
for i in $(seq 0 $((COUNT - 1))); do
    TMP_OUT="$(mktemp -t grok-imagine-out.XXXXXX)"
    if ! jq -er ".data[$i].b64_json" "$RESPONSE_FILE" | "${B64_DECODE[@]}" > "$TMP_OUT"; then
        rm -f "$TMP_OUT"
        echo "Error: failed to decode image index $i." >&2
        exit 1
    fi
    if [[ ! -s "$TMP_OUT" ]]; then
        rm -f "$TMP_OUT"
        echo "Error: decoded image $i is empty." >&2
        exit 1
    fi
    EXT="$(detect_ext "$TMP_OUT")"
    if [[ "$COUNT" -eq 1 ]]; then
        OUT="/tmp/${SLUG}-${TIMESTAMP}.${EXT}"
    else
        OUT="/tmp/${SLUG}-${TIMESTAMP}-$((i + 1)).${EXT}"
    fi
    mv -f "$TMP_OUT" "$OUT"
    PATHS+=("$OUT")
done

for p in "${PATHS[@]}"; do
    printf '%s\n' "$p"
done
