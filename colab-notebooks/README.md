# Notes

## Colab workflow (corporate firewall)

- Best way to write new notebooks in Google Colab: re-save an existing notebook already on GitHub under a new name, then edit it there. Corporate firewalls may not always allow creating/pushing repos from local.
- Always disconnect and delete the runtime once you're done executing code in Colab.
- Corporate firewalls sometimes block outbound calls to LLM APIs (Gemini, OpenAI, etc.), so those calls fail from a work laptop/network even with a valid key. For pure learning purposes, running the same notebook in Google Colab avoids this since the calls go out from Colab's network, not the corporate one.

## Jupyter tips

- `%%capture` magic captures a cell's entire output (print statements, visual output) into a variable, suppressing display while still letting you access it later if needed.
