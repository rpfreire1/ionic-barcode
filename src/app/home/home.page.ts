import {Component, NgZone, OnInit, ViewChild} from '@angular/core';
import {
  Barcode,
  BarcodeFormat,
  BarcodeScanner,
  LensFacing,
} from '@capacitor-mlkit/barcode-scanning';

import {AlertController, IonInput} from '@ionic/angular';
import {ProductService} from "../core/services/product.service";
import {Product} from "../core/types/product.type";
import {CameraModalComponent} from "./component/camera-modal/camera-modal.component";
import {FormBuilder, FormControl, FormGroup} from "@angular/forms";

import {DialogService} from "../core/services/dialog.service";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  @ViewChild('productNewStockInput') productNewStockInput!: IonInput;
  public isPermissionGranted = false;


  isSupported = false;
  barcodes: Barcode[] = [];
  scannedBarcodeValue: string = '';
  productSelected!:Product;
  isProductNewStockInputFocused = false;
  onProductNewStockFocus() {
    this.isProductNewStockInputFocused = true;
  }

  productForm!:FormGroup;

  constructor(private formBuilder: FormBuilder,
              private alertController: AlertController,
              private productService:ProductService,
              private readonly dialogService: DialogService,
              private readonly ngZone: NgZone
  ) {

  }

  ngOnInit() {

    BarcodeScanner.isSupported().then((result) => {
      this.isSupported = result.supported;
    });
    BarcodeScanner.checkPermissions().then((result) => {
      this.isPermissionGranted = result.camera === 'granted';
    });


    this.productForm=this.formBuilder.group(
      {
        productName: new FormControl(''),
        productCode: new FormControl(''),
        productStock: new FormControl(0),
        productNewStock: new FormControl(0)

      }
    );



  }
  public async startScan(): Promise<void> {

    const element = await this.dialogService.showModal({
      component: CameraModalComponent,
      // Set `visibility` to `visible` to show the modal (see `src/theme/variables.scss`)
      cssClass: 'barcode-scanning-modal',
      showBackdrop: false,
      componentProps: {
      },
    });
    element.onDidDismiss().then((result) => {
      const barcode: Barcode | undefined = result.data?.barcode;
      if (barcode) {
        this.scannedBarcodeValue = barcode.rawValue.length > 0 ? barcode.rawValue : '';
        this.getProductByBarCode(this.scannedBarcodeValue);
      }
    });
  }




  async scan(): Promise<void> {
    const granted = await this.requestPermissions();
    if (!granted) {
      this.presentAlert();
      return;
    }
    const { barcodes } = await BarcodeScanner.scan();
    this.barcodes.push(...barcodes);
    this.scannedBarcodeValue = barcodes.length > 0 ? barcodes[0].rawValue : '';
    this.getProductByBarCode(this.scannedBarcodeValue);

  }

  async requestPermissions(): Promise<boolean> {
    const { camera } = await BarcodeScanner.requestPermissions();
    return camera === 'granted' || camera === 'limited';
  }
  onFilterBoxChanged(){
    this.getProductByBarCode(this.scannedBarcodeValue);
  }

  async presentAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permission denied',
      message: 'Please grant camera permission to use the barcode scanner.',
      buttons: ['OK'],
    });
    await alert.present();
  }
  getProductByBarCode(barcode:string){
    this.productService.getProductByBarCode(barcode).subscribe(product=>{

        if (product){
          this.productSelected=product;
          this.productForm.patchValue(
            {
              productName: this.productSelected.nameProduct,
              productCode: this.productSelected.barCodeProduct,
              productStock: this.productSelected.stockProduct,
              productNewStock: 0
            }
          )
          this.productNewStockInput.setFocus();
          this.productForm.get('productName')?.disable();
          this.productForm.get('productCode')?.disable();
          this.productForm.get('productStock')?.disable();


        }

      },
      error => {
        console.error('Error al obtener producto:', error);
      }
    )
  }

  async saveNewStock(){
    if(this.productForm.value.productNewStock){
      const newStock=this.productForm.value.productNewStock;
      this.productService.updateProductStockByCode(this.scannedBarcodeValue,newStock).subscribe(
        product=>{
          this.productForm.patchValue(
            {
              productName: '',
              productCode: '',
              productStock: 0,
              productNewStock: 0
            }
          )
        }
      )
    }

  }


}
