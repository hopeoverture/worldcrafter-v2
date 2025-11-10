#!/bin/bash
#
# Bundle conversational widgets for ChatGPT Apps SDK
#
# This script:
# 1. Builds React widgets using Vite
# 2. Generates HTML wrappers with correct MIME type
# 3. Validates bundle sizes (< 100KB)
# 4. Outputs to dist/widgets/ directory
#
# Usage:
#   ./bundle_widgets.sh
#

set -e  # Exit on error

echo "================================================"
echo "Bundling Conversational Widgets for ChatGPT"
echo "================================================"
echo ""

# Configuration
WIDGETS=(
  "character-card"
  "world-card"
  "location-card"
  "character-sheet"
  "relationship-graph"
  "world-dashboard"
)

DIST_DIR="dist/widgets"
VITE_CONFIG="vite.config.widgets.ts"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check environment
if [ -z "$NEXT_PUBLIC_BASE_URL" ]; then
  echo -e "${YELLOW}Warning: NEXT_PUBLIC_BASE_URL not set${NC}"
  echo "Using fallback: http://localhost:3000"
  export NEXT_PUBLIC_BASE_URL="http://localhost:3000"
fi

# Step 1: Build widgets with Vite
echo "Step 1: Building React widgets with Vite..."
echo ""

if [ ! -f "$VITE_CONFIG" ]; then
  echo -e "${RED}Error: Vite config not found: $VITE_CONFIG${NC}"
  echo "Please create vite.config.widgets.ts first"
  exit 1
fi

npx vite build --config "$VITE_CONFIG"

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Vite build failed${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Vite build complete${NC}"
echo ""

# Step 2: Generate HTML wrappers
echo "Step 2: Generating HTML wrappers..."
echo ""

for widget in "${WIDGETS[@]}"; do
  HTML_FILE="${DIST_DIR}/${widget}.html"
  JS_FILE="${DIST_DIR}/${widget}.js"

  # Check if JS bundle exists
  if [ ! -f "$JS_FILE" ]; then
    echo -e "${RED}Error: JS bundle not found: $JS_FILE${NC}"
    exit 1
  fi

  # Get bundle size
  SIZE=$(stat -f%z "$JS_FILE" 2>/dev/null || stat -c%s "$JS_FILE" 2>/dev/null)
  SIZE_KB=$((SIZE / 1024))

  # Warn if bundle too large
  if [ $SIZE_KB -gt 100 ]; then
    echo -e "${YELLOW}Warning: $widget bundle is ${SIZE_KB}KB (> 100KB)${NC}"
  fi

  # Generate HTML wrapper
  cat > "$HTML_FILE" <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${widget}</title>
  <base href="${NEXT_PUBLIC_BASE_URL}/">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
        'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
        'Helvetica Neue', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background: transparent;
    }
    #root {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/api/widgets/${widget}.js"></script>
  <script>
    // Patch fetch for relative URLs
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (typeof url === 'string' && url.startsWith('/')) {
        url = '${NEXT_PUBLIC_BASE_URL}' + url;
      }
      return originalFetch(url, options);
    };

    // Patch history API for widget navigation
    const originalPushState = history.pushState;
    history.pushState = function(state, title, url) {
      if (window.openai?.setWidgetState) {
        window.openai.setWidgetState({ ...state, url });
      }
      return originalPushState.call(history, state, title, url);
    };
  </script>
</body>
</html>
EOF

  echo -e "  ${GREEN}✓${NC} ${widget}.html (${SIZE_KB}KB)"
done

echo ""
echo -e "${GREEN}✓ HTML wrappers generated${NC}"
echo ""

# Step 3: Validation
echo "Step 3: Validating bundles..."
echo ""

TOTAL_SIZE=0
for widget in "${WIDGETS[@]}"; do
  JS_FILE="${DIST_DIR}/${widget}.js"
  HTML_FILE="${DIST_DIR}/${widget}.html"

  if [ ! -f "$JS_FILE" ] || [ ! -f "$HTML_FILE" ]; then
    echo -e "${RED}Error: Missing files for $widget${NC}"
    exit 1
  fi

  JS_SIZE=$(stat -f%z "$JS_FILE" 2>/dev/null || stat -c%s "$JS_FILE" 2>/dev/null)
  HTML_SIZE=$(stat -f%z "$HTML_FILE" 2>/dev/null || stat -c%s "$HTML_FILE" 2>/dev/null)
  WIDGET_SIZE=$((JS_SIZE + HTML_SIZE))
  TOTAL_SIZE=$((TOTAL_SIZE + WIDGET_SIZE))

  echo "  $widget: $((WIDGET_SIZE / 1024))KB"
done

echo ""
echo -e "${GREEN}✓ All bundles validated${NC}"
echo ""

# Step 4: Summary
echo "================================================"
echo "Bundle Summary"
echo "================================================"
echo ""
echo "  Widgets built:    ${#WIDGETS[@]}"
echo "  Total size:       $((TOTAL_SIZE / 1024))KB"
echo "  Output directory: $DIST_DIR"
echo "  Base URL:         $NEXT_PUBLIC_BASE_URL"
echo ""
echo -e "${GREEN}✓ Widget bundling complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Deploy dist/widgets/ to your server"
echo "  2. Serve widgets from /api/widgets/[name].html"
echo "  3. Test with: curl ${NEXT_PUBLIC_BASE_URL}/api/widgets/character-card.html"
echo ""
