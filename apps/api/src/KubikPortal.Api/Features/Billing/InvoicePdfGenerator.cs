using System.Globalization;
using System.Reflection;
using KubikPortal.Api.Domain;
using PdfSharp.Drawing;
using PdfSharp.Drawing.Layout;
using PdfSharp.Fonts;
using PdfSharp.Pdf;

namespace KubikPortal.Api.Features.Billing;

public sealed class InvoicePdfGenerator
{
    private static readonly object FontLock = new();
    private static readonly CultureInfo GreekCulture = CultureInfo.GetCultureInfo("el-GR");

    public InvoicePdfGenerator()
    {
        lock (FontLock)
        {
            GlobalFontSettings.FontResolver ??= new NotoSansFontResolver();
        }
    }

    public byte[] Generate(Invoice invoice)
    {
        using var document = new PdfDocument();
        document.Info.Title = $"Τιμολόγιο {invoice.Number}";
        document.Info.Author = "KUBIK Portal Demo";
        document.Info.Subject = "Δοκιμαστικό παραστατικό";
        document.Info.CreationDate = invoice.CreatedAt.UtcDateTime;
        document.Info.ModificationDate = invoice.CreatedAt.UtcDateTime;
        var page = document.AddPage();
        page.Size = PdfSharp.PageSize.A4;
        using var graphics = XGraphics.FromPdfPage(page);
        var regular = new XFont("Noto Sans", 9, XFontStyleEx.Regular);
        var small = new XFont("Noto Sans", 8, XFontStyleEx.Regular);
        var bold = new XFont("Noto Sans", 9, XFontStyleEx.Bold);
        var title = new XFont("Noto Sans", 23, XFontStyleEx.Bold);
        var blue = XColor.FromArgb(37, 99, 235);
        var navy = XColor.FromArgb(15, 29, 55);
        var muted = XColor.FromArgb(103, 116, 137);
        const double left = 48;
        var right = page.Width.Point - 48;

        graphics.DrawRoundedRectangle(new XSolidBrush(navy), new XRect(left, 42, right - left, 72), new XSize(10, 10));
        graphics.DrawString("KUBIK", title, XBrushes.White, new XPoint(left + 22, 80));
        graphics.DrawString("PORTAL DEMO · ΔΟΚΙΜΑΣΤΙΚΟ ΠΑΡΑΣΤΑΤΙΚΟ", small, new XSolidBrush(XColor.FromArgb(190, 207, 235)), new XPoint(left + 22, 99));
        graphics.DrawString("ΤΙΜΟΛΟΓΙΟ", bold, XBrushes.White, new XRect(left, 61, right - left - 20, 20), XStringFormats.TopRight);
        graphics.DrawString(invoice.Number, regular, XBrushes.White, new XRect(left, 82, right - left - 20, 20), XStringFormats.TopRight);

        DrawLabelValue(graphics, "Εκδότης", "KUBIK Digital Agency Demo\nΑθήνα, Ελλάδα\nhello@kubik.gr", left, 144, regular, bold, muted);
        DrawLabelValue(graphics, "Πελάτης", $"{invoice.ClientPersona.FirstName} {invoice.ClientPersona.LastName}\n{invoice.ClientPersona.DisplayEmail}", left + 260, 144, regular, bold, muted);
        DrawLabelValue(graphics, "Ημερομηνία έκδοσης", invoice.IssueDate.ToString("dd/MM/yyyy", GreekCulture), left, 216, regular, bold, muted);
        DrawLabelValue(graphics, "Ημερομηνία λήξης", invoice.DueDate.ToString("dd/MM/yyyy", GreekCulture), left + 180, 216, regular, bold, muted);
        DrawLabelValue(graphics, "Κατάσταση", invoice.Status == InvoiceStatus.Paid ? "Εξοφλημένο" : "Ανεξόφλητο", left + 360, 216, regular, bold, muted);

        var tableY = 276d;
        graphics.DrawRectangle(new XSolidBrush(XColor.FromArgb(239, 244, 252)), left, tableY, right - left, 30);
        graphics.DrawString("ΠΕΡΙΓΡΑΦΗ", bold, new XSolidBrush(navy), new XPoint(left + 10, tableY + 20));
        graphics.DrawString("ΠΟΣ.", bold, new XSolidBrush(navy), new XRect(left + 300, tableY + 9, 55, 15), XStringFormats.TopRight);
        graphics.DrawString("ΤΙΜΗ", bold, new XSolidBrush(navy), new XRect(left + 365, tableY + 9, 70, 15), XStringFormats.TopRight);
        graphics.DrawString("ΣΥΝΟΛΟ", bold, new XSolidBrush(navy), new XRect(left + 445, tableY + 9, 55, 15), XStringFormats.TopRight);
        tableY += 30;
        foreach (var line in invoice.Lines.OrderBy(x => x.Position))
        {
            graphics.DrawLine(new XPen(XColor.FromArgb(227, 232, 240)), left, tableY + 33, right, tableY + 33);
            var formatter = new XTextFormatter(graphics);
            formatter.DrawString(line.Description, regular, new XSolidBrush(navy), new XRect(left + 10, tableY + 5, 285, 28), XStringFormats.TopLeft);
            graphics.DrawString(line.Quantity.ToString("0.##", GreekCulture), regular, new XSolidBrush(muted), new XRect(left + 300, tableY + 10, 55, 15), XStringFormats.TopRight);
            graphics.DrawString(Currency(line.UnitPrice), regular, new XSolidBrush(muted), new XRect(left + 365, tableY + 10, 70, 15), XStringFormats.TopRight);
            graphics.DrawString(Currency(line.LineTotal), bold, new XSolidBrush(navy), new XRect(left + 445, tableY + 10, 55, 15), XStringFormats.TopRight);
            tableY += 34;
        }

        var totalsY = Math.Max(tableY + 20, 470);
        DrawTotal(graphics, "Καθαρή αξία", invoice.Subtotal, totalsY, regular, muted, left, right); totalsY += 24;
        DrawTotal(graphics, $"ΦΠΑ {invoice.VatRate:0.##}%", invoice.VatAmount, totalsY, regular, muted, left, right); totalsY += 30;
        graphics.DrawRectangle(new XSolidBrush(blue), right - 190, totalsY - 7, 190, 39);
        graphics.DrawString("ΣΥΝΟΛΟ", bold, XBrushes.White, new XPoint(right - 178, totalsY + 17));
        graphics.DrawString(Currency(invoice.Total), new XFont("Noto Sans", 13, XFontStyleEx.Bold), XBrushes.White, new XRect(right - 130, totalsY + 4, 118, 20), XStringFormats.TopRight);
        if (!string.IsNullOrWhiteSpace(invoice.Notes))
        {
            graphics.DrawString("Σημειώσεις", bold, new XSolidBrush(navy), new XPoint(left, totalsY + 72));
            graphics.DrawString(invoice.Notes, regular, new XSolidBrush(muted), new XRect(left, totalsY + 82, right - left, 45), XStringFormats.TopLeft);
        }
        graphics.DrawString("Το παρόν δημιουργήθηκε αυτόματα από δομημένα demo δεδομένα και δεν αποτελεί φορολογικό παραστατικό.", small,
            new XSolidBrush(muted), new XRect(left, page.Height.Point - 56, right - left, 20), XStringFormats.TopCenter);
        using var stream = new MemoryStream();
        document.Save(stream, false);
        return stream.ToArray();
    }

    private static string Currency(decimal value) => value.ToString("C2", GreekCulture);
    private static void DrawLabelValue(XGraphics graphics, string label, string value, double x, double y, XFont regular, XFont bold, XColor muted)
    {
        graphics.DrawString(label.ToUpper(GreekCulture), bold, new XSolidBrush(muted), new XPoint(x, y));
        var lineY = y + 18;
        foreach (var line in value.Split('\n')) { graphics.DrawString(line, regular, XBrushes.Black, new XPoint(x, lineY)); lineY += 14; }
    }
    private static void DrawTotal(XGraphics graphics, string label, decimal amount, double y, XFont font, XColor muted, double left, double right)
    {
        graphics.DrawString(label, font, new XSolidBrush(muted), new XRect(left, y, right - left - 95, 18), XStringFormats.TopRight);
        graphics.DrawString(Currency(amount), font, XBrushes.Black, new XRect(right - 85, y, 85, 18), XStringFormats.TopRight);
    }
}

public sealed class NotoSansFontResolver : IFontResolver
{
    private const string RegularFace = "NotoSans-Regular";
    private const string BoldFace = "NotoSans-Bold";
    private static readonly Lazy<byte[]> Regular = new(() => Load("NotoSans-Regular.ttf"));
    private static readonly Lazy<byte[]> Bold = new(() => Load("NotoSans-Bold.ttf"));
    public FontResolverInfo ResolveTypeface(string familyName, bool isBold, bool isItalic) => new(isBold ? BoldFace : RegularFace);
    public byte[] GetFont(string faceName) => faceName == BoldFace ? Bold.Value : Regular.Value;
    private static byte[] Load(string suffix)
    {
        var assembly = Assembly.GetExecutingAssembly();
        var name = assembly.GetManifestResourceNames().Single(x => x.EndsWith(suffix, StringComparison.Ordinal));
        using var stream = assembly.GetManifestResourceStream(name)!;
        using var memory = new MemoryStream(); stream.CopyTo(memory); return memory.ToArray();
    }
}
