import Foundation

enum Dates {
    private static let utc = TimeZone(identifier: "UTC") ?? .gmt
    private static let posix = Locale(identifier: "en_US_POSIX")

    private static func formatter(_ format: String) -> DateFormatter {
        let f = DateFormatter()
        f.locale = posix
        f.timeZone = utc
        f.dateFormat = format
        return f
    }

    private static func date(_ iso: String) -> Date {
        formatter("yyyy-MM-dd").date(from: String(iso.prefix(10))) ?? Date(timeIntervalSince1970: 0)
    }

    /// "2026-11-10" → "10 Nov"
    static func dayMonth(_ iso: String) -> String { formatter("d MMM").string(from: date(iso)) }
    /// "2026-11-10" → "Tue 10 Nov"
    static func weekdayDate(_ iso: String) -> String { formatter("EEE d MMM").string(from: date(iso)) }
    /// "2026-11-10" → "Tuesday"
    static func weekdayName(_ iso: String) -> String { formatter("EEEE").string(from: date(iso)) }
    /// "2026-11" → "November"
    static func monthName(_ iso: String) -> String { formatter("MMMM").string(from: date(String(iso.prefix(7)) + "-01")) }
    /// "2026-09" → "Sep 2026"
    static func monthYear(_ iso: String) -> String { formatter("MMM yyyy").string(from: date(String(iso.prefix(7)) + "-01")) }
    /// "…T10:02" → "10:02"
    static func clock(_ iso: String) -> String { String(iso.suffix(5)) }
    /// 2 = Monday … 3 = Tuesday in the Gregorian calendar (1 = Sunday).
    static func weekday(_ iso: String) -> Int {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = utc
        return cal.component(.weekday, from: date(iso))
    }
    static func addDays(_ iso: String, _ n: Int) -> String {
        formatter("yyyy-MM-dd").string(from: date(iso).addingTimeInterval(Double(n) * 86_400))
    }
}

enum Fmt {
    static func euro(_ n: Double) -> String {
        n == n.rounded() ? "€\(Int(n))" : String(format: "€%.2f", n)
    }
    static func num(_ n: Int) -> String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.locale = Locale(identifier: "en_US")
        return f.string(from: NSNumber(value: n)) ?? "\(n)"
    }
    static func keys(_ n: Int) -> String { "\(n) \(n == 1 ? "key" : "keys")" }
    static func kg(_ n: Double) -> String { String(format: "%.1f", n) }
}

extension String {
    var capitalizedFirst: String { prefix(1).uppercased() + dropFirst() }
}
