import { Modal } from 'common/modal/modal';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
// tslint:disable-next-line
const Lightbox = require('react-image-lightbox');

interface INoAccountsModalProps {
}

const images = [
  {
    imageUrl: '/images/dashboard.png',
    style: { marginRight: '1rem' }
  },
  {
    imageUrl: '/images/account.png'
  }
];

@observer
export class NoAccountsModal extends React.Component<INoAccountsModalProps> {
  @observable private photoIndex: false | number = false;

  public render() {
    const noOp = () => undefined;
    const onClose = () => this.photoIndex = false;

    return (
      <Modal title='No Account Setup' onClose={noOp}>
        <p className='h-padding'>There are currently no Ethereum accounts configured. Visit <a href='http://0.0.0.0:8180/#/v1' target='_blank'>the Parity Dashboard</a> to import or create an account.</p>
        <div className='fl c b-padding'>
          {images.map((im, i) => {
            let style: React.CSSProperties = { width: '150px', height: '100px', cursor: 'pointer' };
            if (im.style) {
              style = {
                ...style,
                ...im.style
              };
            }

            return <img style={style} key={i} src={im.imageUrl} onClick={this.launchGallery(i)} />;
          })}
        </div>
        {this.photoIndex !== false && (
          <Lightbox
            mainSrc={images[this.photoIndex].imageUrl}
            nextSrc={images[(this.photoIndex + 1) % images.length]}
            prevSrc={images[(this.photoIndex + images.length - 1) % images.length]}
            onCloseRequest={onClose}
            onMovePrevRequest={this.onMovePrevRequest}
            onMoveNextRequest={this.onMoveNextRequest}
          />
        )}
      </Modal>
    );
  }

  private readonly launchGallery = (i: number) => () => {
    this.photoIndex = i;
  }

  private readonly onMovePrevRequest = () => {
    if (this.photoIndex === false) { return; }
    this.photoIndex = (this.photoIndex + images.length - 1) % images.length;
  }

  private readonly onMoveNextRequest = () => {
    if (this.photoIndex === false) { return; }
    this.photoIndex = (this.photoIndex + 1) % images.length;
  }
}
