import SwiftUI
import SafariServices

@main
struct VideoSpeedControllerApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .commands {
            CommandGroup(replacing: .newItem) {}
        }
    }
}

struct ContentView: View {
    private let extensionId = "com.igrigorik.videospeed.Extension"
    @State private var statusText = "Checking Safari extension status…"
    @State private var isEnabled = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Video Speed Controller")
                    .font(.largeTitle.bold())
                Text("Safari port of igrigorik/videospeed — full shortcuts and features.")
                    .foregroundStyle(.secondary)

                // Critical install callout — website access is the #1 miss
                VStack(alignment: .leading, spacing: 10) {
                    Label("Required: allow access on every website", systemImage: "exclamationmark.triangle.fill")
                        .font(.headline)
                        .foregroundStyle(.primary)

                    Text("Safari turns the extension on, but it still will not run on YouTube (or any site) until website access is granted.")
                        .fixedSize(horizontal: false, vertical: true)

                    Text("In Safari → Settings → Extensions → Video Speed Controller, set Edit Websites / Website Access to All Websites.")
                        .fontWeight(.semibold)
                        .fixedSize(horizontal: false, vertical: true)

                    Text("If it says “Ask”, the extension is installed but inactive until you approve each site — that feels broken. Choose All Websites.")
                        .font(.callout)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.orange.opacity(0.15))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .strokeBorder(Color.orange.opacity(0.55), lineWidth: 1.5)
                )
                .cornerRadius(10)

                GroupBox("Setup checklist") {
                    VStack(alignment: .leading, spacing: 10) {
                        checklistRow(
                            number: "1",
                            title: "Allow unsigned extensions (local builds)",
                            detail: "Safari menu → Develop → Allow Unsigned Extensions. Needed again after every Safari quit."
                        )
                        checklistRow(
                            number: "2",
                            title: "Turn the extension on",
                            detail: "Safari → Settings → Extensions → enable Video Speed Controller."
                        )
                        checklistRow(
                            number: "3",
                            title: "Website access → All Websites",
                            detail: "Same Extensions panel. Without this, shortcuts and the speed overlay never appear — including on YouTube.",
                            emphasize: true
                        )
                        checklistRow(
                            number: "4",
                            title: "Reload the video tab",
                            detail: "Hard-reload (⌘R) after changing access, then press D to speed up."
                        )
                    }
                    .padding(.vertical, 6)
                }

                GroupBox("Default shortcuts") {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("S / D — slower / faster")
                        Text("R — reset to 1×")
                        Text("Z / X — rewind / advance 10s")
                        Text("G — preferred speed toggle")
                        Text("V — show/hide controller")
                        Text("M / J — mark / jump")
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .font(.system(.body, design: .monospaced))
                    .padding(.vertical, 4)
                }

                Text(statusText)
                    .foregroundStyle(isEnabled ? .green : .orange)

                HStack {
                    Button("Open Safari Extension Settings") {
                        openSettings()
                    }
                    .keyboardShortcut(.defaultAction)

                    Button("Refresh Status") {
                        refreshStatus()
                    }
                }

                Text("Tip: after opening Extension Settings, look for “Website Access”, “Edit Websites”, or “For [site]” under Video Speed Controller and set it to All Websites.")
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(28)
        }
        .frame(minWidth: 560, minHeight: 520)
        .onAppear(perform: refreshStatus)
    }

    @ViewBuilder
    private func checklistRow(number: String, title: String, detail: String, emphasize: Bool = false) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Text(number)
                .font(.headline.monospacedDigit())
                .frame(width: 22, height: 22)
                .background(emphasize ? Color.orange.opacity(0.35) : Color.secondary.opacity(0.2))
                .clipShape(Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .fontWeight(emphasize ? .bold : .semibold)
                Text(detail)
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private func refreshStatus() {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionId) { state, error in
            DispatchQueue.main.async {
                if let error {
                    statusText = "Could not read extension state: \(error.localizedDescription)"
                    isEnabled = false
                    return
                }
                guard let state else {
                    statusText = "Extension not registered yet. Open Safari Extension Settings, enable it, then set Website Access to All Websites."
                    isEnabled = false
                    return
                }
                isEnabled = state.isEnabled
                statusText = state.isEnabled
                    ? "Extension toggle is ON — confirm Website Access is All Websites, then reload your video tab."
                    : "Extension is installed but disabled. Enable it, then set Website Access to All Websites."
            }
        }
    }

    private func openSettings() {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionId) { error in
            DispatchQueue.main.async {
                if let error {
                    statusText = "Could not open Safari settings: \(error.localizedDescription)"
                } else {
                    statusText = "In the Extensions panel: enable the extension, then set Website Access to All Websites."
                    refreshStatus()
                }
            }
        }
    }
}
