#!/bin/bash
# Headless packaging (simplified): deploy + MediaMTX pare + Debian package.
# Prereqs: pnpm clean, pnpm install, pnpm build:all (run separately).
# Usage: bash package-headless-new.sh [amd64|arm64|armhf]
# Example: bash package-headless-new.sh amd64

set -e

ARCH_INPUT=${1:-amd64}  # amd64, arm64, or armhf (x64 will be mapped to amd64)
# Map x64 to amd64 for Debian package architecture
# Map armhf to armv7l for Node.js downloads (armhf is Debian name, armv7l is Node.js name)
if [ "$ARCH_INPUT" = "x64" ]; then
    ARCH="amd64"
elif [ "$ARCH_INPUT" = "armhf" ]; then
    ARCH="armhf"  # Use armhf for Debian package
else
    ARCH="$ARCH_INPUT"
fi

PACKAGE_NAME="axiocnc-server"
INSTALL_DIR="/opt/axiocnc"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
BUILD_ROOT="${PROJECT_ROOT}/build/linux-${ARCH}"
DEPLOY_DIR="${BUILD_ROOT}/deploy"
OUT_DIR="${PROJECT_ROOT}/out"
NODE_VERSION="20.18.0"  # Node.js LTS version to bundle

cd "${PROJECT_ROOT}"

echo "📦 Packaging AxioCNC server for ${ARCH}..."

# Get current version from server package.json
VERSION=$(node -e "console.log(require('./apps/server/package.json').version)")
echo "Version: ${VERSION}"

# Pre-flight: assume pnpm clean, install, build:all already done
echo "🔍 Pre-flight checks..."
if [ ! -d "apps/server/dist" ]; then
    echo "❌ Missing server build output (run pnpm build:all first)"
    exit 1
fi
if [ ! -f "apps/server/dist/cli.js" ]; then
    echo "❌ Missing server dist/cli.js"
    exit 1
fi

# Prepare deploy directory
echo "🧹 Preparing ${DEPLOY_DIR}..."
rm -rf "${DEPLOY_DIR}"
mkdir -p "${DEPLOY_DIR}"

# Deploy server (server, web, shared end up in node_modules/@axiocnc/*)
echo "📦 Deploying @axiocnc/server..."
pnpm deploy --prod --filter @axiocnc/server "${DEPLOY_DIR}" || {
    echo "❌ pnpm deploy failed"
    exit 1
}

# Verify deploy layout
echo "✅ Verifying bundle layout..."
if [ ! -d "${DEPLOY_DIR}/node_modules" ]; then
    echo "❌ Missing node_modules"
    exit 1
fi
if [ ! -f "${DEPLOY_DIR}/package.json" ]; then
    echo "❌ Missing package.json"
    exit 1
fi
# pnpm deploy puts the package at the root level, not in node_modules
SERVER_ROOT="${DEPLOY_DIR}"
if [ ! -d "${SERVER_ROOT}/dist" ]; then
    echo "❌ Missing dist directory (server build output)"
    exit 1
fi
SERVER_CLI="${SERVER_ROOT}/dist/cli.js"
if [ ! -f "${SERVER_CLI}" ]; then
    echo "❌ Missing server dist/cli.js"
    exit 1
fi

# Pare MediaMTX to target platform (lives under server dist directory)
VENDOR_MEDIAMTX_PATH="${SERVER_ROOT}/dist/vendor/mediamtx"
get_mediamtx_platform() {
    local plat="$1"
    local a="$2"
    if [ "$plat" = "linux" ]; then
        if [ "$a" = "amd64" ] || [ "$a" = "x64" ]; then
            echo "linux-amd64"
            return
        fi
        if [ "$a" = "arm64" ]; then
            echo "linux-arm64"
            return
        fi
        if [ "$a" = "armhf" ] || [ "$a" = "armv7l" ]; then
            echo "linux-armv7"
            return
        fi
    fi
    echo ""
}

MEDIAMTX_PLATFORM=$(get_mediamtx_platform "linux" "${ARCH}")
if [ -d "${VENDOR_MEDIAMTX_PATH}" ] && [ -n "${MEDIAMTX_PLATFORM}" ]; then
    echo "🔍 Filtering vendor/mediamtx to ${MEDIAMTX_PLATFORM}..."
    if [ -d "${VENDOR_MEDIAMTX_PATH}" ]; then
        for dir in "${VENDOR_MEDIAMTX_PATH}"/*; do
            if [ -d "$dir" ]; then
                dirname=$(basename "$dir")
                if [ "$dirname" != "${MEDIAMTX_PLATFORM}" ]; then
                    rm -rf "$dir"
                fi
            fi
        done
    fi
    echo "✅ Filtered vendor/mediamtx to ${MEDIAMTX_PLATFORM} only"
elif [ -d "${VENDOR_MEDIAMTX_PATH}" ]; then
    echo "⚠️  Could not determine mediamtx platform for linux-${ARCH}; keeping all"
else
    echo "   No vendor/mediamtx found, skipping filter"
fi

# Download and extract Node.js binary
echo "📥 Downloading Node.js ${NODE_VERSION} for ${ARCH}..."
NODE_DOWNLOAD_DIR="${BUILD_ROOT}/.node-download"
rm -rf "${NODE_DOWNLOAD_DIR}"
mkdir -p "${NODE_DOWNLOAD_DIR}"

# Map architecture for Node.js downloads
case "${ARCH}" in
    amd64)
        NODE_ARCH="x64"
        ;;
    arm64)
        NODE_ARCH="arm64"
        ;;
    armhf)
        NODE_ARCH="armv7l"  # Node.js uses armv7l, Debian uses armhf
        ;;
    *)
        echo "❌ Unsupported architecture: ${ARCH}"
        exit 1
        ;;
esac

NODE_TARBALL="node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz"
NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/${NODE_TARBALL}"

cd "${NODE_DOWNLOAD_DIR}"
if ! curl -fsSL "${NODE_URL}" -o "${NODE_TARBALL}"; then
    echo "❌ Failed to download Node.js from ${NODE_URL}"
    exit 1
fi

echo "📦 Extracting Node.js..."
tar -xf "${NODE_TARBALL}"

cd "${PROJECT_ROOT}"

# Create package structure
PACKAGE_ROOT="${BUILD_ROOT}/${PACKAGE_NAME}_${VERSION}_${ARCH}"
rm -rf "${PACKAGE_ROOT}"
mkdir -p "${PACKAGE_ROOT}${INSTALL_DIR}"
mkdir -p "${PACKAGE_ROOT}/usr/bin"
mkdir -p "${PACKAGE_ROOT}/etc/systemd/system"
mkdir -p "${PACKAGE_ROOT}/DEBIAN"

# Copy Node.js binary to package
echo "📋 Bundling Node.js..."
NODE_DIR="${NODE_DOWNLOAD_DIR}/node-v${NODE_VERSION}-linux-${NODE_ARCH}"
mkdir -p "${PACKAGE_ROOT}${INSTALL_DIR}/nodejs"
cp -r "${NODE_DIR}/bin" "${PACKAGE_ROOT}${INSTALL_DIR}/nodejs/"
cp -r "${NODE_DIR}/lib" "${PACKAGE_ROOT}${INSTALL_DIR}/nodejs/" 2>/dev/null || true
cp -r "${NODE_DIR}/include" "${PACKAGE_ROOT}${INSTALL_DIR}/nodejs/" 2>/dev/null || true
cp -r "${NODE_DIR}/share" "${PACKAGE_ROOT}${INSTALL_DIR}/nodejs/" 2>/dev/null || true

# Copy the deployed application to package structure
echo "📋 Copying deployed application..."
cp -r "${DEPLOY_DIR}"/* "${PACKAGE_ROOT}${INSTALL_DIR}/"

# Note: cli.js is used directly from dist/cli.js (no rename needed)
# Systemd and launcher scripts reference {{INSTALL_DIR}}/dist/cli.js

# Create launcher script from template
echo "📝 Creating launcher script from template..."
LAUNCHER_TEMPLATE="${PROJECT_ROOT}/apps/server/assets/axiocnc-launcher.sh.template"
if [ ! -f "${LAUNCHER_TEMPLATE}" ]; then
    echo "❌ Missing launcher template at ${LAUNCHER_TEMPLATE}"
    exit 1
fi
sed "s|{{INSTALL_DIR}}|${INSTALL_DIR}|g" "${LAUNCHER_TEMPLATE}" > "${PACKAGE_ROOT}/usr/bin/axiocnc"
chmod +x "${PACKAGE_ROOT}/usr/bin/axiocnc"

# Create systemd service file from template
echo "📝 Creating systemd service from template..."
SERVICE_TEMPLATE="${PROJECT_ROOT}/apps/server/assets/axiocnc.service.template"
if [ ! -f "${SERVICE_TEMPLATE}" ]; then
    echo "❌ Missing service template at ${SERVICE_TEMPLATE}"
    exit 1
fi
sed "s|{{INSTALL_DIR}}|${INSTALL_DIR}|g" "${SERVICE_TEMPLATE}" > "${PACKAGE_ROOT}/etc/systemd/system/axiocnc.service"

# Create control file
echo "📝 Creating Debian control file..."
cat > "${PACKAGE_ROOT}/DEBIAN/control" << EOF
Package: ${PACKAGE_NAME}
Version: ${VERSION}
Architecture: ${ARCH}
Maintainer: AxioCNC Team
Description: AxioCNC - Web-based CNC controller interface (Server)
 AxioCNC is a web-based interface for CNC controllers running Grbl,
 Marlin, Smoothieware, or TinyG. This package provides the server
 component for headless deployment with bundled Node.js ${NODE_VERSION}.
Depends: udev
Section: utils
Priority: optional
EOF

# Create post-install script
echo "📝 Creating post-install script..."
cat > "${PACKAGE_ROOT}/DEBIAN/postinst" << EOF
#!/bin/bash
set -e

# Add user to dialout group for serial port access
if [ -n "\$SUDO_USER" ]; then
    USER="\$SUDO_USER"
elif [ -n "\$USER" ]; then
    USER="\$USER"
else
    USER=\$(logname 2>/dev/null || echo "")
fi

if [ -n "\$USER" ] && [ "\$USER" != "root" ]; then
    echo "Adding user '\$USER' to dialout group for serial port access..."
    usermod -a -G dialout "\$USER" || true
fi

# Create log directory in user's home directory
# The launcher script will create ~/.axiocnc/logs when run by the user

# Enable systemd service (optional - user can enable manually)
# systemctl daemon-reload
# systemctl enable axiocnc || true

echo ""
echo "AxioCNC server installed successfully!"
echo "Node.js ${NODE_VERSION} is bundled with this package."
echo ""
echo "To start the server:"
echo "  axiocnc --port 8000 --host 0.0.0.0"
echo ""
echo "Or enable as a service:"
echo "  sudo systemctl enable axiocnc"
echo "  sudo systemctl start axiocnc"
echo ""
echo "Note: You may need to log out and back in for serial port access."
EOF
chmod +x "${PACKAGE_ROOT}/DEBIAN/postinst"

# Create pre-remove script
echo "📝 Creating pre-remove script..."
cat > "${PACKAGE_ROOT}/DEBIAN/prerm" << 'EOF'
#!/bin/bash
# Stop service if running
systemctl stop axiocnc || true
systemctl disable axiocnc || true
EOF
chmod +x "${PACKAGE_ROOT}/DEBIAN/prerm"

# Create post-remove script
echo "📝 Creating post-remove script..."
cat > "${PACKAGE_ROOT}/DEBIAN/postrm" << 'EOF'
#!/bin/bash
# Log files are stored in ~/.axiocnc/logs and are preserved for user inspection
# No cleanup needed as user directories are not managed by package removal
EOF
chmod +x "${PACKAGE_ROOT}/DEBIAN/postrm"

# Ensure output directory exists
mkdir -p "${OUT_DIR}"

# Build .deb package
echo "📦 Building .deb package..."
OUTPUT_FILENAME="axiocnc-headless_${VERSION}_${ARCH}.deb"
dpkg-deb --build "${PACKAGE_ROOT}" "${OUT_DIR}/${OUTPUT_FILENAME}"

# Get package size
PACKAGE_SIZE=$(du -h "${OUT_DIR}/${OUTPUT_FILENAME}" | cut -f1)

echo ""
echo "✅ Server package built: ${OUT_DIR}/${OUTPUT_FILENAME} (${PACKAGE_SIZE})"
echo "   Node.js ${NODE_VERSION} is bundled - no system Node.js required!"
echo ""
echo "Install with:"
echo "  sudo dpkg -i ${OUT_DIR}/${OUTPUT_FILENAME}"
echo "  sudo apt-get install -f  # if dependencies missing"
