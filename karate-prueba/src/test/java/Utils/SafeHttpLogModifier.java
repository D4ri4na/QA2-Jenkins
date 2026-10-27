package Utils;

import com.intuit.karate.http.HttpLogModifier;

public class SafeHttpLogModifier implements HttpLogModifier {
    private final String token = System.getenv("GOREST_TOKEN");

    private String mask(String value) {
        return value == null || token == null || token.isEmpty()
                ? value : value.replace(token.trim(), "[REDACTED]");
    }

    @Override
    public boolean enableForUri(String uri) { return true; }

    @Override
    public String uri(String uri) { return mask(uri); }

    @Override
    public String header(String header, String value) {
        return "Authorization".equalsIgnoreCase(header) ? "[REDACTED]" : mask(value);
    }

    @Override
    public String request(String uri, String request) { return mask(request); }

    @Override
    public String response(String uri, String response) { return mask(response); }
}
