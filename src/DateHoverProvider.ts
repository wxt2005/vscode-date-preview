import * as vscode from 'vscode';
import * as dayjs from 'dayjs';
import * as utcPlugin from 'dayjs/plugin/utc';

dayjs.extend(utcPlugin)

class DateHoverProvider implements vscode.HoverProvider, vscode.Disposable {
  private dateRegexp = {
    iso8601: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(Z|\+\d{2}:\d{2})/,
    epoch: /\d{9,14}/
  };

  get detectIso8601Enabled(): boolean {
    return vscode.workspace.getConfiguration().get<boolean>('date-preview.detect.ISO-8601String', true);
  }

  get detectEpochEnabled(): boolean {
    return vscode.workspace.getConfiguration().get<boolean>('date-preview.detect.epochTimestamp', true);
  }

  get localPreviewEnabled(): boolean {
    return vscode.workspace.getConfiguration().get<boolean>('date-preview.localPreview.enable', true);
  }

  get localPreviewFormat(): string {
    return vscode.workspace.getConfiguration().get<string>('date-preview.localPreview.format', '');
  }

  get customPreivews(): Array<ICustomPreview> {
    return vscode.workspace.getConfiguration().get<Array<ICustomPreview>>('date-preview.customPreview', []);
  }

  provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
    let date: any = undefined;
    let msg = '';

    if (this.detectIso8601Enabled) {
      const isoRange = document.getWordRangeAtPosition(position, this.dateRegexp.iso8601);

      if (isoRange) {
        const hoveredWord = document.getText(isoRange);
        date = dayjs(hoveredWord);
      }
    }

    if (this.detectEpochEnabled) {
      const epochRange = document.getWordRangeAtPosition(position, this.dateRegexp.epoch);

      if (epochRange) {
        let hoveredWord = document.getText(epochRange);
        // convert millonseconds to seconds
        if (hoveredWord.length <= 10) {
          hoveredWord += '000';
        }

        date = dayjs(+hoveredWord);
      }
    }

    if (date !== undefined && (date as dayjs.Dayjs).isValid()) {
      msg = this.buildPreviewMessage(date);
    }

    return msg ? new vscode.Hover(msg) : undefined;
  }

  buildPreviewMessage(date: dayjs.Dayjs): string {
    let res = '';

    if (this.localPreviewEnabled) {
      const localDateFormat = this.localPreviewFormat;
      const localDateStr = localDateFormat ? date.format(localDateFormat) : date.format();
      res += this.buildSinglePreviewItem('Local', date.format('Z'), localDateStr);
    }

    if (this.customPreivews.length) {
      for (const item of this.customPreivews) {
        if (!item.name) {
          continue;
        }

        const dateObj = typeof item.utcOffset === 'number' ? date.utcOffset(item.utcOffset) : date;
        const dateStr = `${item.format ? dateObj.format(item.format) : dateObj.format()}`;
        res += this.buildSinglePreviewItem(item.name, dateObj.format('Z'), dateStr);
      }
    }

    return res;
  }

  buildSinglePreviewItem(name: string, utcOffsetStr: string, dateString: string): string {
    return `\n\n*${name} (${utcOffsetStr})*  \n${dateString}`;
  }
  
  dispose() {
    // no operation
  }
}

export default DateHoverProvider;